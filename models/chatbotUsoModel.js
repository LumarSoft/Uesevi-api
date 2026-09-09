import { pool } from "../db/db.js";
import { calcularCosto, costoDeMedicion, precios, preciosConfigurados } from "../utils/chatbotCostos.js";
import { logError } from "../utils/logger.js";

// ---------------------------------------------------------------------------
// Medición y cupo del asistente "Nacho".
//
// Cada consulta al modelo cuesta plata real (tokens de OpenAI). Este módulo
// guarda una fila por consulta con los tokens y el costo, y a partir de eso
// responde dos preguntas distintas:
//
//   - Al personal de UESEVI: cuántas consultas usó del cupo del mes.
//   - Al proveedor del sistema: cuánto costó, cuánto proyecta y qué margen deja.
//
// La unidad que se cobra es la CONSULTA, no el token: una pregunta puede
// disparar hasta 8 llamadas al modelo y nadie del sindicato debería tener que
// entender eso. Los tokens quedan guardados igual, para poder recalcular costos
// si cambian las tarifas.
// ---------------------------------------------------------------------------

const TABLA_USO = "chatbot_uso";
const TABLA_PLAN = "chatbot_plan";

const DDL_USO = `
  CREATE TABLE IF NOT EXISTS ${TABLA_USO} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha DATETIME NOT NULL,
    periodo CHAR(7) NOT NULL COMMENT 'aaaa-mm del consumo',
    modelo VARCHAR(80) NOT NULL,
    vueltas TINYINT UNSIGNED NOT NULL DEFAULT 0,
    llamadas_modelo TINYINT UNSIGNED NOT NULL DEFAULT 0,
    herramientas TINYINT UNSIGNED NOT NULL DEFAULT 0,
    tokens_entrada INT UNSIGNED NOT NULL DEFAULT 0,
    tokens_cacheados INT UNSIGNED NOT NULL DEFAULT 0,
    tokens_salida INT UNSIGNED NOT NULL DEFAULT 0,
    tokens_razonamiento INT UNSIGNED NOT NULL DEFAULT 0,
    costo_usd DECIMAL(12,6) NOT NULL DEFAULT 0,
    duracion_ms INT UNSIGNED NOT NULL DEFAULT 0,
    con_archivo TINYINT(1) NOT NULL DEFAULT 0,
    estado ENUM('ok','error','cancelada') NOT NULL DEFAULT 'ok',
    KEY idx_chatbot_uso_periodo (periodo),
    KEY idx_chatbot_uso_usuario_periodo (usuario_id, periodo),
    KEY idx_chatbot_uso_fecha (fecha)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

const DDL_PLAN = `
  CREATE TABLE IF NOT EXISTS ${TABLA_PLAN} (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    modo ENUM('prueba','plan') NOT NULL DEFAULT 'prueba',
    consultas_incluidas INT UNSIGNED NOT NULL DEFAULT 300,
    tope_usd DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    prueba_inicio DATE NULL,
    prueba_dias SMALLINT UNSIGNED NOT NULL DEFAULT 14,
    actualizado DATETIME NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

// Las migraciones del proyecto se aplican a mano (db/migrations/). El DDL de
// estas dos tablas está en db/migrations/2026_09_chatbot_uso.sql, pero además se
// asegura acá: si el deploy se hizo sin correr la migración, el asistente sigue
// funcionando y midiendo en vez de tirar 500. Es un CREATE ... IF NOT EXISTS por
// proceso, no por request.
let listo = null;
const asegurarTablas = async () => {
  if (!listo) {
    listo = (async () => {
      await pool.query(DDL_USO);
      await pool.query(DDL_PLAN);
      await pool.query(
        `INSERT IGNORE INTO ${TABLA_PLAN}
           (id, modo, consultas_incluidas, tope_usd, prueba_inicio, prueba_dias, actualizado)
         VALUES (1, 'prueba', 300, 5.00, CURDATE(), 14, NOW())`
      );
    })().catch((error) => {
      // Si falla, la próxima llamada lo reintenta en vez de quedar rota para
      // siempre con una promesa rechazada cacheada.
      listo = null;
      throw error;
    });
  }
  return listo;
};

const periodoDe = (fecha = new Date()) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

const aNumero = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
};

const redondear = (valor, decimales = 2) => {
  const factor = 10 ** decimales;
  return Math.round(aNumero(valor) * factor) / factor;
};

// Nivel del cupo: es lo que decide el color de la barra en el panel.
const nivelDeCupo = (porcentaje, agotado) => {
  if (agotado) return "agotado";
  if (porcentaje >= 95) return "critico";
  if (porcentaje >= 80) return "aviso";
  return "ok";
};

const chatbotUsoModel = {
  periodoDe,

  async obtenerPlan() {
    await asegurarTablas();
    const [filas] = await pool.query(`SELECT * FROM ${TABLA_PLAN} WHERE id = 1`);
    const plan = filas[0] || {};
    // mysql2 devuelve DATE como Date: se manda como 'aaaa-mm-dd' para que el
    // panel no tenga que lidiar con husos horarios.
    const inicio =
      plan.prueba_inicio instanceof Date
        ? plan.prueba_inicio.toLocaleDateString("en-CA")
        : plan.prueba_inicio || null;
    return {
      modo: plan.modo || "prueba",
      consultas_incluidas: aNumero(plan.consultas_incluidas),
      tope_usd: aNumero(plan.tope_usd),
      prueba_inicio: inicio,
      prueba_dias: aNumero(plan.prueba_dias),
    };
  },

  async actualizarPlan(cambios = {}) {
    await asegurarTablas();
    const campos = [];
    const valores = [];
    const permitidos = {
      modo: (valor) => (["prueba", "plan"].includes(valor) ? valor : null),
      consultas_incluidas: (valor) => (Number.isFinite(Number(valor)) ? Math.max(0, Math.trunc(Number(valor))) : null),
      tope_usd: (valor) => (Number.isFinite(Number(valor)) ? Math.max(0, Number(valor)) : null),
      prueba_dias: (valor) => (Number.isFinite(Number(valor)) ? Math.max(0, Math.trunc(Number(valor))) : null),
      prueba_inicio: (valor) => (/^\d{4}-\d{2}-\d{2}$/.test(String(valor)) ? String(valor) : null),
    };
    for (const [campo, normalizar] of Object.entries(permitidos)) {
      if (cambios[campo] === undefined) continue;
      const valor = normalizar(cambios[campo]);
      if (valor === null) continue;
      campos.push(`${campo} = ?`);
      valores.push(valor);
    }
    if (!campos.length) return this.obtenerPlan();
    await pool.query(
      `UPDATE ${TABLA_PLAN} SET ${campos.join(", ")}, actualizado = NOW() WHERE id = 1`,
      valores
    );
    return this.obtenerPlan();
  },

  /**
   * Guarda una consulta ya terminada. Nunca tira: si falla el insert se loguea
   * y la respuesta al admin sigue su curso (perder una medición es molesto,
   * romperle el chat es peor).
   */
  async registrarConsulta({
    usuarioId,
    modelo,
    medicion,
    herramientas = 0,
    duracionMs = 0,
    conArchivo = false,
    estado = "ok",
  }) {
    try {
      if (!usuarioId || !medicion?.tokens_entrada) return null;
      await asegurarTablas();
      const [resultado] = await pool.query(
        `INSERT INTO ${TABLA_USO}
           (usuario_id, fecha, periodo, modelo, vueltas, llamadas_modelo, herramientas,
            tokens_entrada, tokens_cacheados, tokens_salida, tokens_razonamiento,
            costo_usd, duracion_ms, con_archivo, estado)
         VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          usuarioId,
          periodoDe(),
          modelo,
          medicion.vueltas || 0,
          medicion.llamadas_modelo || 0,
          herramientas,
          medicion.tokens_entrada || 0,
          medicion.tokens_cacheados || 0,
          medicion.tokens_salida || 0,
          medicion.tokens_razonamiento || 0,
          costoDeMedicion(medicion),
          duracionMs,
          conArchivo ? 1 : 0,
          estado,
        ]
      );
      return resultado.insertId;
    } catch (error) {
      logError("chatbot.uso.registrar", error, { usuarioId });
      return null;
    }
  },

  // Totales crudos de un período (o de un usuario dentro del período).
  async totalesDelPeriodo(periodo = periodoDe(), usuarioId = null) {
    await asegurarTablas();
    const condiciones = ["periodo = ?"];
    const valores = [periodo];
    if (usuarioId) {
      condiciones.push("usuario_id = ?");
      valores.push(usuarioId);
    }
    const [filas] = await pool.query(
      `SELECT COUNT(*) AS consultas,
              COALESCE(SUM(tokens_entrada), 0) AS tokens_entrada,
              COALESCE(SUM(tokens_cacheados), 0) AS tokens_cacheados,
              COALESCE(SUM(tokens_salida), 0) AS tokens_salida,
              COALESCE(SUM(tokens_razonamiento), 0) AS tokens_razonamiento,
              COALESCE(SUM(costo_usd), 0) AS costo_usd,
              COALESCE(AVG(duracion_ms), 0) AS duracion_promedio_ms,
              COALESCE(SUM(estado = 'error'), 0) AS con_error,
              COALESCE(SUM(con_archivo), 0) AS con_archivo,
              MIN(fecha) AS primera,
              MAX(fecha) AS ultima
         FROM ${TABLA_USO}
        WHERE ${condiciones.join(" AND ")}`,
      valores
    );
    const fila = filas[0] || {};
    return {
      consultas: aNumero(fila.consultas),
      tokens_entrada: aNumero(fila.tokens_entrada),
      tokens_cacheados: aNumero(fila.tokens_cacheados),
      tokens_salida: aNumero(fila.tokens_salida),
      tokens_razonamiento: aNumero(fila.tokens_razonamiento),
      costo_usd: aNumero(fila.costo_usd),
      duracion_promedio_ms: aNumero(fila.duracion_promedio_ms),
      con_error: aNumero(fila.con_error),
      con_archivo: aNumero(fila.con_archivo),
      primera: fila.primera || null,
      ultima: fila.ultima || null,
    };
  },

  /**
   * Estado del cupo del período actual. Es lo que consume el panel para dibujar
   * la barra, y también lo que decide si se deja pasar una consulta nueva.
   */
  async estadoDeCupo() {
    const plan = await this.obtenerPlan();
    const periodo = periodoDe();
    const totales = await this.totalesDelPeriodo(periodo);
    const costoDelPeriodo = calcularCosto({
      entrada: totales.tokens_entrada,
      cacheados: totales.tokens_cacheados,
      salida: totales.tokens_salida,
    });

    const incluidas = plan.consultas_incluidas;
    const usadas = totales.consultas;
    const restantes = Math.max(0, incluidas - usadas);
    // Con 1 consulta de 300 el redondeo da 0 y el panel mostraría "0 % usado"
    // con la barra ya pintada. Habiendo consumo, el mínimo que se muestra es 1 %.
    const porcentaje =
      incluidas > 0 && usadas > 0
        ? Math.min(100, Math.max(1, Math.round((usadas / incluidas) * 100)))
        : 0;

    // En modo prueba nunca se bloquea por cupo: la prueba existe justamente
    // para medir cuánto se usa. El tope en dólares sí frena siempre: es el
    // seguro contra un mes raro o un uso desbocado.
    const sinCupo = incluidas > 0 && usadas >= incluidas;
    const superoTope = plan.tope_usd > 0 && costoDelPeriodo >= plan.tope_usd;
    const bloqueado = superoTope || (plan.modo === "plan" && sinCupo);

    let prueba = null;
    if (plan.modo === "prueba" && plan.prueba_inicio) {
      // Sin la hora, el string se parsea como UTC y en Argentina (UTC-3) el
      // primer día de la prueba ya arrancaría contando 2.
      const inicio = new Date(`${plan.prueba_inicio}T00:00:00`);
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + plan.prueba_dias);
      const dia = Math.floor((Date.now() - inicio.getTime()) / 86400000) + 1;
      prueba = {
        inicio: plan.prueba_inicio,
        dias: plan.prueba_dias,
        dia: Math.max(1, dia),
        fin: fin.toISOString().slice(0, 10),
        activa: Date.now() < fin.getTime(),
      };
    }

    return {
      periodo,
      modo: plan.modo,
      consultas_usadas: usadas,
      consultas_incluidas: incluidas,
      consultas_restantes: restantes,
      porcentaje,
      nivel: nivelDeCupo(porcentaje, bloqueado),
      bloqueado,
      motivo_bloqueo: bloqueado ? (superoTope ? "tope" : "cupo") : null,
      prueba,
      // Sólo para el proveedor: el panel de UESEVI no muestra nada de esto.
      costos: {
        // Recalculado sobre los tokens con las tarifas de hoy, no la suma de
        // `costo_usd`: las filas guardadas antes de configurar las tarifas
        // tienen costo 0 y ensuciarían el total.
        costo_usd: redondear(costoDelPeriodo, 4),
        costo_promedio_usd: usadas ? redondear(costoDelPeriodo / usadas, 4) : 0,
        tope_usd: plan.tope_usd,
        tokens_entrada: totales.tokens_entrada,
        tokens_cacheados: totales.tokens_cacheados,
        tokens_salida: totales.tokens_salida,
        tokens_razonamiento: totales.tokens_razonamiento,
        // Porcentaje de la entrada que salió del caché: si es bajo, el prompt
        // se está armando mal y estamos pagando de más.
        cache_hit: totales.tokens_entrada
          ? redondear((totales.tokens_cacheados / totales.tokens_entrada) * 100, 1)
          : 0,
        duracion_promedio_ms: Math.round(totales.duracion_promedio_ms),
        con_error: totales.con_error,
        precios_configurados: preciosConfigurados(),
        precios: precios(),
      },
    };
  },

  // Serie diaria del período: para ver el ritmo de uso durante la prueba.
  async porDia(periodo = periodoDe()) {
    await asegurarTablas();
    const [filas] = await pool.query(
      `SELECT DATE(fecha) AS dia,
              COUNT(*) AS consultas,
              COALESCE(SUM(costo_usd), 0) AS costo_usd,
              COALESCE(SUM(tokens_entrada + tokens_salida), 0) AS tokens
         FROM ${TABLA_USO}
        WHERE periodo = ?
        GROUP BY DATE(fecha)
        ORDER BY dia ASC`,
      [periodo]
    );
    return filas.map((fila) => ({
      dia: fila.dia instanceof Date ? fila.dia.toISOString().slice(0, 10) : String(fila.dia),
      consultas: aNumero(fila.consultas),
      costo_usd: redondear(fila.costo_usd, 4),
      tokens: aNumero(fila.tokens),
    }));
  },

  // Consumo por admin: sirve para saber si lo usa todo el equipo o una persona.
  async porUsuario(periodo = periodoDe()) {
    await asegurarTablas();
    const [filas] = await pool.query(
      `SELECT u.usuario_id,
              COALESCE(NULLIF(TRIM(CONCAT(COALESCE(us.nombre, ''), ' ', COALESCE(us.apellido, ''))), ''), us.email) AS nombre,
              COUNT(*) AS consultas,
              COALESCE(SUM(u.costo_usd), 0) AS costo_usd
         FROM ${TABLA_USO} u
         LEFT JOIN usuarios us ON us.id = u.usuario_id
        WHERE u.periodo = ?
        GROUP BY u.usuario_id, us.nombre, us.apellido, us.email
        ORDER BY consultas DESC`,
      [periodo]
    );
    return filas.map((fila) => ({
      usuario_id: aNumero(fila.usuario_id),
      nombre: fila.nombre || `Usuario ${fila.usuario_id}`,
      consultas: aNumero(fila.consultas),
      costo_usd: redondear(fila.costo_usd, 4),
    }));
  },

  // Histórico mes a mes, para ver la tendencia una vez que el plan esté en marcha.
  async porPeriodo(limite = 12) {
    await asegurarTablas();
    const [filas] = await pool.query(
      `SELECT periodo,
              COUNT(*) AS consultas,
              COALESCE(SUM(costo_usd), 0) AS costo_usd,
              COALESCE(SUM(tokens_entrada), 0) AS tokens_entrada,
              COALESCE(SUM(tokens_salida), 0) AS tokens_salida
         FROM ${TABLA_USO}
        GROUP BY periodo
        ORDER BY periodo DESC
        LIMIT ?`,
      [Math.max(1, Math.min(60, Math.trunc(Number(limite) || 12)))]
    );
    return filas.map((fila) => ({
      periodo: fila.periodo,
      consultas: aNumero(fila.consultas),
      costo_usd: redondear(fila.costo_usd, 4),
      tokens_entrada: aNumero(fila.tokens_entrada),
      tokens_salida: aNumero(fila.tokens_salida),
    }));
  },

  /**
   * Costo recalculado con las tarifas de HOY sobre los tokens guardados. Se usa
   * para el reporte: si durante la prueba las tarifas estaban mal configuradas
   * (o directamente ausentes), el costo por fila quedó mal, pero los tokens no.
   */
  async costoRecalculado(periodo = periodoDe()) {
    const totales = await this.totalesDelPeriodo(periodo);
    return calcularCosto({
      entrada: totales.tokens_entrada,
      cacheados: totales.tokens_cacheados,
      salida: totales.tokens_salida,
    });
  },
};

export default chatbotUsoModel;
