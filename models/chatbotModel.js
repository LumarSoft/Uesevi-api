import { pool } from "../db/db.js";
import { calcInterest } from "../utils/interest.js";

// ---------------------------------------------------------------------------
// Capa de datos del asistente "Nacho".
//
// Regla de oro: todo lo que Nacho le dice al personal sale de acá, y el
// personal actúa en base a eso. Por lo tanto cada consulta replica el criterio
// que ya usan las pantallas del panel (statementsModel, paymentsPanelModel,
// dashboardModel): misma definición de "vigente", de "activo", de "pagado".
// Si una pantalla y Nacho no coinciden, el bug está acá.
// ---------------------------------------------------------------------------

// Sub-consulta reutilizable: se queda con la rectificación vigente de cada
// período (la de mayor `rectificada`). Ver CLAUDE.md — omitirla es el bug
// clásico: períodos duplicados y totales mal calculados.
const JOIN_VIGENTE = `
  INNER JOIN (
    SELECT empresa_id, mes, year, MAX(rectificada) AS max_rectificada
    FROM declaraciones_juradas
    GROUP BY empresa_id, mes, year
  ) mx ON mx.empresa_id = dj.empresa_id AND mx.mes = dj.mes
      AND mx.year = dj.year AND mx.max_rectificada = dj.rectificada
`;

// Desglose congelado (auxiliar) + estado del Panel de Pagos de cada DDJJ.
// - auxiliar puede tener más de una fila por declaración (16 casos en la base):
//   se toma la última, igual que hace el detalle de la DDJJ (ORDER BY id DESC).
// - pagos_panel tuvo duplicados históricos: se agrupa para que el JOIN nunca
//   multiplique filas.
const JOIN_DESGLOSE_Y_PANEL = `
  LEFT JOIN (
    SELECT id_declaracion, MAX(id) AS max_id FROM auxiliar GROUP BY id_declaracion
  ) auxm ON auxm.id_declaracion = dj.id
  LEFT JOIN auxiliar aux ON aux.id = auxm.max_id
  LEFT JOIN (
    SELECT declaracion_jurada_id,
           MAX(estado_pago) AS estado_pago,
           MAX(fecha_pago) AS fecha_pago,
           MAX(total) AS total
    FROM pagos_panel
    GROUP BY declaracion_jurada_id
  ) pp ON pp.declaracion_jurada_id = dj.id
`;

const COLUMNAS_DDJJ = `
  dj.id, dj.empresa_id, dj.mes, dj.year, dj.rectificada, dj.fecha AS fecha_carga,
  dj.subtotal, dj.interes, dj.importe, dj.vencimiento,
  dj.fecha_pago, dj.pago_parcial, dj.estado,
  (SELECT COUNT(*) FROM sueldos s
    WHERE s.declaraciones_jurada_id = dj.id AND s.deleted IS NULL) AS empleados_declarados,
  (SELECT COUNT(*) FROM sueldos s
    WHERE s.declaraciones_jurada_id = dj.id AND s.deleted IS NULL
      AND s.sindicato_activo = 1) AS afiliados_declarados,
  aux.fas AS aux_fas, aux.solidario AS aux_solidario,
  aux.sindical AS aux_sindical, aux.total AS aux_total,
  pp.estado_pago AS panel_estado_pago, pp.fecha_pago AS panel_fecha_pago,
  pp.total AS panel_total
`;

// Estados de declaraciones_juradas.estado. NULL existe: son ~1.770 filas
// migradas del sistema viejo (períodos 2020-2023). Las pantallas del panel las
// excluyen de "pendientes" (statementsModel filtra estado <> 1 AND <> 3, que
// con NULL da falso) — acá se hace lo mismo.
const ESTADO_DDJJ = {
  0: "Pendiente de pago",
  1: "Pagada / aprobada",
  2: "Pago parcial",
  3: "Rectificada (reemplazada por otra fila)",
};

const describirEstado = (estado) => {
  if (estado === null || estado === undefined) {
    return "Sin estado (declaración histórica migrada del sistema anterior)";
  }
  return ESTADO_DDJJ[estado] ?? `Desconocido (${estado})`;
};

const describirEstadoContrato = (estado, deleted) => {
  if (deleted) return "Dado de baja";
  if (String(estado) === "1") return "Vigente";
  return `No vigente (estado ${estado})`;
};

const periodo = (mes, year) => `${mes}/${year}`;

// CUIT y CUIL están cargados con y sin guiones; para buscar normalizamos ambos lados.
const soloDigitos = (texto) => String(texto ?? "").replace(/\D/g, "");

const aNumero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

const redondear2 = (valor) => Number((Number(valor) || 0).toFixed(2));

const fechaISO = (valor) => {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Vencimiento de un período: último día del mes siguiente (mismo criterio que
// utils/interest.js: new Date(year, mes + 1, 0) con mes en base 1).
const ultimoDiaMesSiguiente = (mes, year) => new Date(year, mes + 1, 0);

// Cuántos períodos sin declarar se listan como máximo (las cantidades totales
// se informan aparte, sin recortar).
const TOPE_PERIODOS_LISTADOS = 24;

const hoySinHora = () => {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
};

/**
 * Convierte una fila cruda de DDJJ (con COLUMNAS_DDJJ) en el objeto que ve el
 * modelo. Se separan tres cosas que el personal suele confundir:
 *   - `estado` de la declaración (tabla declaraciones_juradas),
 *   - `desglose` congelado en `auxiliar` (FAS / solidario / sindical),
 *   - `pago_panel`: la confirmación en el Panel de Pagos, que es independiente.
 */
const formatearDeclaracion = (fila) => {
  const tieneDesglose = fila.aux_total !== null && fila.aux_total !== undefined;
  const panelConfirmado = Number(fila.panel_estado_pago) === 1;
  return {
    id: fila.id,
    empresa_id: fila.empresa_id,
    periodo: periodo(fila.mes, fila.year),
    mes: fila.mes,
    year: fila.year,
    rectificada: fila.rectificada,
    fecha_carga: fechaISO(fila.fecha_carga),
    subtotal: aNumero(fila.subtotal),
    interes: aNumero(fila.interes),
    importe: aNumero(fila.importe),
    vencimiento: fechaISO(fila.vencimiento),
    fecha_pago: fechaISO(fila.fecha_pago),
    pago_parcial: aNumero(fila.pago_parcial),
    estado: fila.estado,
    estado_descripcion: describirEstado(fila.estado),
    empleados_declarados: Number(fila.empleados_declarados ?? 0),
    afiliados_declarados: Number(fila.afiliados_declarados ?? 0),
    desglose: tieneDesglose
      ? {
          fas: aNumero(fila.aux_fas),
          solidario: aNumero(fila.aux_solidario),
          sindical: aNumero(fila.aux_sindical),
          total: aNumero(fila.aux_total),
        }
      : null,
    pago_panel: {
      confirmado: panelConfirmado,
      fecha_pago: fechaISO(fila.panel_fecha_pago),
      total_registrado: aNumero(fila.panel_total),
    },
  };
};

// ---------------------------------------------------------------------------
// Tablas y columnas visibles para la herramienta de SQL libre de solo lectura.
// Todo lo que no esté acá se rechaza antes de tocar la base.
// ---------------------------------------------------------------------------
export const TABLAS_PERMITIDAS = [
  "empresas",
  "empleados",
  "contratos",
  "usuarios",
  "declaraciones_juradas",
  "sueldos",
  "auxiliar",
  "categorias",
  "tasa",
  "pagos_panel",
  "noticias",
  "consultas",
  "inscripcion",
  "estados",
];

// Columnas sensibles: nunca se devuelven ni se pueden nombrar en una consulta.
export const COLUMNAS_PROHIBIDAS = ["password", "hash", "caducidad"];

export const ESTADOS_EMPRESA = ["Activo", "Inactivo", "Pendiente"];

// Tope de tiempo para el SQL libre: una consulta mal armada no puede colgar la
// conexión del pool que comparte todo el panel.
const MAX_EXECUTION_TIME_MS = 15000;

// ---------------------------------------------------------------------------
// Búsqueda aproximada de empresas. El personal escribe "Cruspa" por GRUSPA o
// "Segurida Total" por SEGURIDAD TOTAL: un LIKE no encuentra nada y el
// asistente respondía "no existe". Con ~120 empresas alcanza con traerlas y
// puntuar por bigramas; siempre se devuelve marcado como aproximado para que
// el modelo pida confirmación en vez de dar por buena la coincidencia.
// ---------------------------------------------------------------------------
const normalizarTexto = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const bigramas = (texto) => {
  const limpio = normalizarTexto(texto).replace(/ /g, "");
  const conjunto = new Map();
  for (let i = 0; i < limpio.length - 1; i += 1) {
    const par = limpio.slice(i, i + 2);
    conjunto.set(par, (conjunto.get(par) || 0) + 1);
  }
  return conjunto;
};

const similitud = (a, b) => {
  const ba = bigramas(a);
  const bb = bigramas(b);
  if (!ba.size || !bb.size) return 0;
  let comunes = 0;
  for (const [par, cantidad] of ba) {
    if (bb.has(par)) comunes += Math.min(cantidad, bb.get(par));
  }
  let totalA = 0;
  let totalB = 0;
  for (const c of ba.values()) totalA += c;
  for (const c of bb.values()) totalB += c;
  return (2 * comunes) / (totalA + totalB);
};

// Palabras que aparecen en casi todos los nombres del rubro: no distinguen
// nada y harían que "Zorzal Seguridad" matchee con cualquier "... Seguridad".
const PALABRAS_GENERICAS = new Set([
  "seguridad", "vigilancia", "privada", "empresa", "empresas", "servicio", "servicios",
  "integral", "srl", "sa", "sas", "sacif", "cia", "compania", "de", "del", "la", "el",
  "los", "las", "y", "e", "en", "grupo", "argentina", "rosario", "santa", "fe",
]);

const palabrasDistintivas = (texto) =>
  normalizarTexto(texto)
    .split(" ")
    .filter((p) => p.length > 2 && !PALABRAS_GENERICAS.has(p));

// Se compara lo distintivo de la búsqueda contra lo distintivo del nombre:
// completo y palabra por palabra (así "gruspa" matchea "GRUSPA SEGURIDAD SRL").
// Si la búsqueda sólo tiene palabras genéricas no hay nada que comparar.
const puntajeEmpresa = (busqueda, nombre) => {
  const claveBusqueda = palabrasDistintivas(busqueda);
  const claveNombre = palabrasDistintivas(nombre);
  if (!claveBusqueda.length || !claveNombre.length) return 0;
  const candidatos = [claveNombre.join(" "), ...claveNombre];
  const objetivo = claveBusqueda.join(" ");
  return Math.max(
    ...candidatos.map((c) => similitud(objetivo, c)),
    ...claveBusqueda.flatMap((palabra) => claveNombre.map((c) => similitud(palabra, c)))
  );
};

const UMBRAL_SIMILITUD = 0.5;
const MAX_APROXIMADAS = 5;

const chatbotModel = {
  // -------------------------------------------------------------------------
  // Lecturas
  // -------------------------------------------------------------------------
  searchCompanies: async ({ texto = "", estado = null, limit = 15 }) => {
    const like = `%${texto}%`;
    // Los CUIT están cargados con y sin guiones: comparamos sólo los dígitos.
    const digitos = soloDigitos(texto);
    const filtroEstado = estado ? "AND e.estado = ?" : "";
    const params = [like, like, like];
    // Sin dígitos en la búsqueda, el LIKE '%%' del CUIT matchearía todo.
    const filtroCuit = digitos ? "OR REPLACE(REPLACE(e.cuit, '-', ''), ' ', '') LIKE ?" : "";
    if (digitos) params.push(`%${digitos}%`);
    if (estado) params.push(estado);
    params.push(limit);

    const query = `
      SELECT e.id, e.cuit, e.nombre, e.email_contacto, e.telefono,
             e.domicilio, e.ciudad, e.estado, u.email AS email_usuario
      FROM empresas e
      LEFT JOIN usuarios u ON u.id = e.usuario_id
      WHERE (e.nombre LIKE ? OR e.email_contacto LIKE ? OR u.email LIKE ? ${filtroCuit})
        ${filtroEstado}
      ORDER BY e.nombre ASC
      LIMIT ?;
    `;
    const [rows] = await pool.query(query, params);
    if (rows.length) return { empresas: rows, aproximada: false };

    // Nada exacto: se intenta por similitud sobre el nombre.
    const busqueda = normalizarTexto(texto);
    if (busqueda.length < 3) return { empresas: [], aproximada: false };

    const [todas] = await pool.query(
      `SELECT e.id, e.cuit, e.nombre, e.email_contacto, e.telefono,
              e.domicilio, e.ciudad, e.estado, u.email AS email_usuario
       FROM empresas e
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       ${estado ? "WHERE e.estado = ?" : ""};`,
      estado ? [estado] : []
    );
    const puntuadas = todas
      .map((empresa) => ({ ...empresa, similitud: puntajeEmpresa(busqueda, empresa.nombre) }))
      .filter((empresa) => empresa.similitud >= UMBRAL_SIMILITUD)
      .sort((a, b) => b.similitud - a.similitud)
      .slice(0, MAX_APROXIMADAS)
      .map((empresa) => ({ ...empresa, similitud: Number(empresa.similitud.toFixed(2)) }));

    return { empresas: puntuadas, aproximada: true };
  },

  getCompany: async (id) => {
    const query = `
      SELECT e.id, e.cuit, e.nombre, e.email_contacto, e.telefono, e.domicilio,
             e.ciudad, e.numero_agencia, e.estado, e.created AS fecha_alta,
             u.id AS usuario_id, u.email AS email_usuario, u.estado AS estado_usuario
      FROM empresas e
      LEFT JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.id = ?;
    `;
    const [rows] = await pool.query(query, [id]);
    if (!rows.length) return null;

    const [[conteo]] = await pool.query(
      `SELECT COUNT(DISTINCT c.empleado_id) AS empleados_activos,
              COUNT(DISTINCT CASE WHEN emp.sindicato_activo = 1 THEN c.empleado_id END) AS afiliados_activos
       FROM contratos c
       INNER JOIN empleados emp ON emp.id = c.empleado_id
       WHERE c.empresa_id = ? AND c.deleted IS NULL AND c.estado = '1';`,
      [id]
    );

    const [[ddjj]] = await pool.query(
      `SELECT COUNT(*) AS declaraciones_vigentes,
              MIN(CONCAT(dj.year, '-', LPAD(dj.mes, 2, '0'))) AS primer_periodo,
              MAX(CONCAT(dj.year, '-', LPAD(dj.mes, 2, '0'))) AS ultimo_periodo
       FROM declaraciones_juradas dj
       ${JOIN_VIGENTE}
       WHERE dj.empresa_id = ?;`,
      [id]
    );

    return {
      ...rows[0],
      fecha_alta: fechaISO(rows[0].fecha_alta),
      empleados_activos: Number(conteo.empleados_activos),
      afiliados_activos: Number(conteo.afiliados_activos),
      declaraciones_vigentes: Number(ddjj.declaraciones_vigentes),
      primer_periodo_declarado: ddjj.primer_periodo,
      ultimo_periodo_declarado: ddjj.ultimo_periodo,
    };
  },

  lastStatement: async (empresaId) => {
    const query = `
      SELECT ${COLUMNAS_DDJJ}
      FROM declaraciones_juradas dj
      ${JOIN_VIGENTE}
      ${JOIN_DESGLOSE_Y_PANEL}
      WHERE dj.empresa_id = ?
      ORDER BY dj.year DESC, dj.mes DESC
      LIMIT 1;
    `;
    const [rows] = await pool.query(query, [empresaId]);
    if (!rows.length) return null;
    return formatearDeclaracion(rows[0]);
  },

  // Una declaración por id, sea o no la vigente. `es_vigente` avisa si fue
  // reemplazada por una rectificación posterior.
  getStatement: async (id) => {
    const query = `
      SELECT ${COLUMNAS_DDJJ},
             e.nombre AS empresa_nombre, e.cuit AS empresa_cuit,
             (SELECT MAX(d2.rectificada) FROM declaraciones_juradas d2
               WHERE d2.empresa_id = dj.empresa_id AND d2.mes = dj.mes AND d2.year = dj.year) AS max_rectificada
      FROM declaraciones_juradas dj
      INNER JOIN empresas e ON e.id = dj.empresa_id
      ${JOIN_DESGLOSE_Y_PANEL}
      WHERE dj.id = ?;
    `;
    const [rows] = await pool.query(query, [id]);
    if (!rows.length) return null;
    const fila = rows[0];
    return {
      ...formatearDeclaracion(fila),
      empresa: { id: fila.empresa_id, nombre: fila.empresa_nombre, cuit: fila.empresa_cuit },
      es_vigente: Number(fila.rectificada) === Number(fila.max_rectificada),
      rectificaciones_del_periodo: Number(fila.max_rectificada),
    };
  },

  // Buscar la DDJJ vigente de una empresa para un período puntual.
  getStatementByPeriod: async ({ empresaId, mes, year }) => {
    const query = `
      SELECT ${COLUMNAS_DDJJ}
      FROM declaraciones_juradas dj
      ${JOIN_VIGENTE}
      ${JOIN_DESGLOSE_Y_PANEL}
      WHERE dj.empresa_id = ? AND dj.mes = ? AND dj.year = ?
      LIMIT 1;
    `;
    const [rows] = await pool.query(query, [empresaId, mes, year]);
    return rows.length ? formatearDeclaracion(rows[0]) : null;
  },

  listStatements: async ({ empresaId, year = null, mes = null, estado = null, limit = 24 }) => {
    const condiciones = ["dj.empresa_id = ?"];
    const params = [empresaId];
    if (year !== null) {
      condiciones.push("dj.year = ?");
      params.push(year);
    }
    if (mes !== null) {
      condiciones.push("dj.mes = ?");
      params.push(mes);
    }
    if (estado !== null) {
      condiciones.push("dj.estado = ?");
      params.push(estado);
    }
    params.push(limit);

    const query = `
      SELECT ${COLUMNAS_DDJJ}
      FROM declaraciones_juradas dj
      ${JOIN_VIGENTE}
      ${JOIN_DESGLOSE_Y_PANEL}
      WHERE ${condiciones.join(" AND ")}
      ORDER BY dj.year DESC, dj.mes DESC
      LIMIT ?;
    `;
    const [rows] = await pool.query(query, params);
    return rows.map(formatearDeclaracion);
  },

  // Empleados incluidos en una declaración: la foto congelada de `sueldos`.
  statementEmployees: async ({ declaracionId, limit = 200 }) => {
    const query = `
      SELECT s.id AS sueldo_id, s.contrato_id,
             emp.id AS empleado_id, emp.cuil,
             u.nombre, u.apellido,
             s.categoria_id, cat.nombre AS categoria,
             s.sindicato_activo AS afiliado_al_declarar,
             s.monto AS sueldo_declarado,
             s.adicional, s.adicional_norem, s.remunerativo_adicional,
             s.sueldo_basico AS basico_categoria_al_declarar,
             s.presentismo AS presentismo_categoria_al_declarar
      FROM sueldos s
      LEFT JOIN contratos c ON c.id = s.contrato_id
      LEFT JOIN empleados emp ON emp.id = c.empleado_id
      LEFT JOIN usuarios u ON u.id = emp.usuario_id
      LEFT JOIN categorias cat ON cat.id = s.categoria_id
      WHERE s.declaraciones_jurada_id = ? AND s.deleted IS NULL
      ORDER BY u.apellido ASC, u.nombre ASC
      LIMIT ?;
    `;
    const [rows] = await pool.query(query, [declaracionId, limit]);
    return rows.map((r) => ({
      ...r,
      afiliado_al_declarar: Number(r.afiliado_al_declarar) === 1,
      sueldo_declarado: aNumero(r.sueldo_declarado),
      adicional: aNumero(r.adicional),
      adicional_norem: aNumero(r.adicional_norem),
      remunerativo_adicional: aNumero(r.remunerativo_adicional),
      basico_categoria_al_declarar: aNumero(r.basico_categoria_al_declarar),
      presentismo_categoria_al_declarar: aNumero(r.presentismo_categoria_al_declarar),
    }));
  },

  // Períodos sin DDJJ entre la primera declaración de la empresa y el mes
  // pasado. Cada faltante dice si ya venció: el mes anterior está "en término"
  // hasta el último día del mes corriente, no es deuda todavía.
  missingPeriods: async (empresaId) => {
    const [rows] = await pool.query(
      `SELECT DISTINCT dj.mes, dj.year
       FROM declaraciones_juradas dj
       WHERE dj.empresa_id = ?
       ORDER BY dj.year ASC, dj.mes ASC;`,
      [empresaId]
    );

    const presentes = new Set(rows.map((r) => `${r.year}-${r.mes}`));
    let primero = rows[0];
    let sinDeclaraciones = false;
    let alta = null;

    // Una empresa sin NINGUNA declaración no es una empresa sin períodos
    // faltantes: es el peor caso posible y antes salía como "no debe nada"
    // simplemente porque no había ninguna fila desde donde arrancar el rango.
    // En ese caso el rango arranca en el alta de la empresa.
    if (!rows.length) {
      const [empresa] = await pool.query(
        `SELECT created FROM empresas WHERE id = ? LIMIT 1;`,
        [empresaId]
      );
      if (!empresa[0]?.created) {
        return { faltantes: [], cantidad_faltantes: 0, cantidad_faltantes_vencidos: 0, desde: null, hasta: null };
      }
      sinDeclaraciones = true;
      const fechaAlta = new Date(empresa[0].created);
      alta = fechaISO(fechaAlta);
      primero = { mes: fechaAlta.getMonth() + 1, year: fechaAlta.getFullYear() };
    }

    const hoy = hoySinHora();
    // El período corriente todavía no se puede declarar completo: se controla
    // hasta el mes anterior.
    let hastaYear = hoy.getFullYear();
    let hastaMes = hoy.getMonth(); // getMonth() es 0-11, o sea el mes anterior en base 1
    if (hastaMes === 0) {
      hastaMes = 12;
      hastaYear -= 1;
    }

    const faltantes = [];
    let year = primero.year;
    let mes = primero.mes;
    while (year < hastaYear || (year === hastaYear && mes <= hastaMes)) {
      if (!presentes.has(`${year}-${mes}`)) {
        const vencimiento = ultimoDiaMesSiguiente(mes, year);
        faltantes.push({
          periodo: periodo(mes, year),
          mes,
          year,
          vencimiento: fechaISO(vencimiento),
          vencido: vencimiento < hoy,
        });
      }
      mes += 1;
      if (mes > 12) {
        mes = 1;
        year += 1;
      }
    }

    const vencidos = faltantes.filter((p) => p.vencido);
    // El listado se acota para no inflar el contexto del modelo (una empresa que
    // nunca declaró desde 2020 son más de 50 períodos), pero las cantidades que
    // se informan son siempre las reales.
    const recortado = faltantes.length > TOPE_PERIODOS_LISTADOS;
    return {
      faltantes: recortado ? faltantes.slice(-TOPE_PERIODOS_LISTADOS) : faltantes,
      cantidad_faltantes: faltantes.length,
      cantidad_faltantes_vencidos: vencidos.length,
      // El rango real de los faltantes va aparte del listado: si sólo se
      // informa la lista recortada, el modelo deduce el "desde" del primer
      // elemento visible y le dice al usuario un período de inicio que no es.
      primer_periodo_sin_declarar: faltantes[0]?.periodo ?? null,
      ultimo_periodo_sin_declarar: faltantes[faltantes.length - 1]?.periodo ?? null,
      primer_periodo_vencido_sin_declarar: vencidos[0]?.periodo ?? null,
      listado_recortado: recortado,
      sin_declaraciones: sinDeclaraciones,
      ...(sinDeclaraciones ? { alta_empresa: alta } : {}),
      desde: { mes: primero.mes, year: primero.year, periodo: periodo(primero.mes, primero.year) },
      hasta: { mes: hastaMes, year: hastaYear, periodo: periodo(hastaMes, hastaYear) },
    };
  },

  /**
   * Deuda de una empresa calculada con la MISMA fórmula que el Panel de Pagos
   * (utils/interest.js): por cada DDJJ vigente impaga se estima el interés que
   * correspondería si se pagara hoy. Es una estimación a la fecha; la cifra
   * definitiva la fija el panel al cargar la fecha real de pago.
   */
  companyDebt: async (empresaId) => {
    const [tasa] = await pool.query(`SELECT porcentaje FROM tasa ORDER BY id ASC LIMIT 1;`);
    const porcentaje = Number(tasa[0]?.porcentaje ?? 0);

    const query = `
      SELECT ${COLUMNAS_DDJJ}
      FROM declaraciones_juradas dj
      ${JOIN_VIGENTE}
      ${JOIN_DESGLOSE_Y_PANEL}
      WHERE dj.empresa_id = ? AND dj.estado IN (0, 2)
      ORDER BY dj.year ASC, dj.mes ASC;
    `;
    const [rows] = await pool.query(query, [empresaId]);

    const hoy = hoySinHora();
    const hoyISO = fechaISO(hoy);
    const impagas = [];
    const confirmadasEnPanel = [];
    const totales = { subtotal: 0, interes_estimado: 0, total_estimado: 0, pagos_parciales: 0, saldo_estimado: 0 };

    for (const fila of rows) {
      const ddjj = formatearDeclaracion(fila);
      if (ddjj.pago_panel.confirmado) {
        // Pendiente en la DDJJ pero cobrada según el Panel: se informa aparte,
        // no se suma como deuda.
        confirmadasEnPanel.push(ddjj);
        continue;
      }
      const base = ddjj.subtotal ?? ddjj.importe ?? 0;
      const calculo = calcInterest({
        subtotal: base,
        mes: ddjj.mes,
        year: ddjj.year,
        fechaPago: hoy,
        porcentaje,
      });
      const pagoParcial = ddjj.pago_parcial ?? 0;
      const saldo = Number((calculo.importe - pagoParcial).toFixed(2));
      impagas.push({
        ...ddjj,
        vencida: ddjj.vencimiento ? new Date(`${ddjj.vencimiento}T00:00:00`) < hoy : false,
        dias_atraso_a_hoy: calculo.diasAtraso,
        interes_estimado_a_hoy: calculo.interes,
        total_estimado_a_hoy: calculo.importe,
        saldo_estimado_a_hoy: saldo,
      });
      totales.subtotal += base;
      totales.interes_estimado += calculo.interes;
      totales.total_estimado += calculo.importe;
      totales.pagos_parciales += pagoParcial;
      totales.saldo_estimado += saldo;
    }

    for (const clave of Object.keys(totales)) {
      totales[clave] = Number(totales[clave].toFixed(2));
    }

    return {
      fecha_calculo: hoyISO,
      tasa_diaria_porcentaje: porcentaje,
      cantidad_periodos_impagos: impagas.length,
      periodos_impagos: impagas,
      totales,
      pendientes_en_ddjj_pero_confirmadas_en_panel: confirmadasEnPanel,
    };
  },

  /**
   * Búsqueda de empleados por nombre, apellido, email o CUIL.
   *
   * El texto se parte en palabras y se exige que TODAS aparezcan en alguno de
   * esos campos. Antes se comparaba la frase entera contra cada campo y contra
   * `CONCAT(nombre, ' ', apellido)`, así que sólo funcionaba escribiendo el
   * nombre primero: "Antonelli, Sergio" —tal como lo muestra el listado del
   * panel— no encontraba a nadie, y Nacho respondía que el empleado no existe.
   * La coma y cualquier otro separador se ignoran.
   */
  searchEmployees: async ({ texto = "", limit = 15 }) => {
    const palabras = String(texto ?? "")
      .split(/[\s,;]+/)
      .map((palabra) => palabra.trim())
      .filter(Boolean)
      .slice(0, 6); // más de seis palabras es basura, no una búsqueda

    if (!palabras.length) return [];

    const condiciones = [];
    const params = [];
    for (const palabra of palabras) {
      const like = `%${palabra}%`;
      const partes = ["u.nombre LIKE ?", "u.apellido LIKE ?", "u.email LIKE ?"];
      params.push(like, like, like);

      // Un CUIL puede venir con guiones o con puntos: se comparan sólo los
      // dígitos contra la columna igualmente normalizada.
      const digitos = soloDigitos(palabra);
      if (digitos) {
        partes.push("REPLACE(REPLACE(emp.cuil, '-', ''), ' ', '') LIKE ?");
        params.push(`%${digitos}%`);
      }
      condiciones.push(`(${partes.join(" OR ")})`);
    }
    params.push(limit);

    const query = `
      SELECT emp.id, emp.cuil, emp.numero_socio, emp.sindicato_activo,
             emp.categoria_id, cat.nombre AS categoria,
             u.nombre, u.apellido, u.email, u.telefono, u.deleted AS usuario_baja,
             c.id AS contrato_id, c.puesto, c.fecha_ingreso, c.estado AS estado_contrato,
             e.id AS empresa_id, e.nombre AS empresa, e.cuit AS cuit_empresa, e.estado AS estado_empresa
      FROM empleados emp
      LEFT JOIN usuarios u ON u.id = emp.usuario_id
      LEFT JOIN categorias cat ON cat.id = emp.categoria_id
      LEFT JOIN contratos c ON c.empleado_id = emp.id AND c.deleted IS NULL AND c.estado = '1'
      LEFT JOIN empresas e ON e.id = c.empresa_id
      WHERE ${condiciones.join(" AND ")}
      ORDER BY u.apellido ASC, u.nombre ASC
      LIMIT ?;
    `;
    const [rows] = await pool.query(query, params);
    return rows.map((r) => ({
      ...r,
      afiliado: Number(r.sindicato_activo) === 1,
      fecha_ingreso: fechaISO(r.fecha_ingreso),
      usuario_baja: r.usuario_baja ? fechaISO(r.usuario_baja) : null,
      contrato_vigente: r.contrato_id
        ? { id: r.contrato_id, empresa_id: r.empresa_id, empresa: r.empresa, cuit_empresa: r.cuit_empresa, estado_empresa: r.estado_empresa, puesto: r.puesto }
        : null,
      situacion: r.contrato_id
        ? `Trabaja en ${r.empresa} (contrato vigente)`
        : "Sin contrato vigente en ninguna empresa",
    }));
  },

  listCompanyEmployees: async ({ empresaId, soloActivos = true, limit = 100 }) => {
    const filtro = soloActivos ? "AND c.deleted IS NULL AND c.estado = '1'" : "";
    const query = `
      SELECT emp.id, emp.cuil, emp.sindicato_activo, emp.categoria_id, cat.nombre AS categoria,
             u.nombre, u.apellido, u.email,
             c.id AS contrato_id, c.puesto, c.fecha_ingreso, c.estado AS estado_contrato, c.deleted AS contrato_baja
      FROM contratos c
      INNER JOIN empleados emp ON emp.id = c.empleado_id
      LEFT JOIN usuarios u ON u.id = emp.usuario_id
      LEFT JOIN categorias cat ON cat.id = emp.categoria_id
      WHERE c.empresa_id = ? ${filtro}
      ORDER BY u.apellido ASC, u.nombre ASC
      LIMIT ?;
    `;
    const [[conteo]] = await pool.query(
      `SELECT COUNT(*) AS total FROM contratos c WHERE c.empresa_id = ? ${filtro};`,
      [empresaId]
    );
    const [rows] = await pool.query(query, [empresaId, limit]);
    return {
      total: Number(conteo.total),
      empleados: rows.map((r) => ({
        ...r,
        afiliado: Number(r.sindicato_activo) === 1,
        fecha_ingreso: fechaISO(r.fecha_ingreso),
        estado_contrato_descripcion: describirEstadoContrato(r.estado_contrato, r.contrato_baja),
        contrato_baja: r.contrato_baja ? fechaISO(r.contrato_baja) : null,
      })),
    };
  },

  /**
   * Empresas con DDJJ vigentes impagas (estado 0 o 2), vencidas y no
   * confirmadas en el Panel de Pagos.
   *
   * El interés se calcula acá, por declaración, con la misma función que el
   * Panel de Pagos y que companyDebt: antes esta herramienta devolvía sólo el
   * saldo sin mora y, para dar un total actualizado, el modelo terminaba
   * sumando a mano montos que había leído de otra herramienta. Ahora el total
   * sale de un único lugar.
   *
   * `totales` cubre TODAS las empresas deudoras, no sólo las que entran en el
   * `limit` del listado.
   */
  debtorCompanies: async ({ limit = 20, incluirInactivas = false }) => {
    const [tasa] = await pool.query(`SELECT porcentaje FROM tasa ORDER BY id ASC LIMIT 1;`);
    const porcentaje = Number(tasa[0]?.porcentaje ?? 0);

    const filtroEmpresa = incluirInactivas ? "" : "AND e.estado = 'Activo'";
    // Una fila por declaración impaga: el interés depende del vencimiento de
    // cada período, así que no se puede agrupar en SQL.
    const query = `
      SELECT e.id, e.nombre, e.cuit, e.estado AS estado_empresa, e.email_contacto, e.telefono,
             dj.mes, dj.year, COALESCE(dj.subtotal, dj.importe) AS base,
             COALESCE(dj.pago_parcial, 0) AS pago_parcial
      FROM declaraciones_juradas dj
      ${JOIN_VIGENTE}
      INNER JOIN empresas e ON e.id = dj.empresa_id
      LEFT JOIN (
        SELECT declaracion_jurada_id, MAX(estado_pago) AS estado_pago
        FROM pagos_panel GROUP BY declaracion_jurada_id
      ) pp ON pp.declaracion_jurada_id = dj.id
      WHERE dj.estado IN (0, 2)
        AND dj.vencimiento < CURDATE()
        AND COALESCE(pp.estado_pago, 0) <> 1
        ${filtroEmpresa}
      ORDER BY e.id ASC, dj.year ASC, dj.mes ASC;
    `;
    const [rows] = await pool.query(query);

    const hoy = hoySinHora();
    const porEmpresa = new Map();

    for (const fila of rows) {
      const base = Number(fila.base) || 0;
      const parcial = Number(fila.pago_parcial) || 0;
      const calculo = calcInterest({
        subtotal: base,
        mes: fila.mes,
        year: fila.year,
        fechaPago: hoy,
        porcentaje,
      });

      let empresa = porEmpresa.get(fila.id);
      if (!empresa) {
        empresa = {
          id: fila.id,
          nombre: fila.nombre,
          cuit: fila.cuit,
          estado_empresa: fila.estado_empresa,
          email_contacto: fila.email_contacto,
          telefono: fila.telefono,
          periodos_impagos: 0,
          subtotal_impago: 0,
          interes_estimado_a_hoy: 0,
          saldo_sin_interes: 0,
          total_estimado_a_hoy: 0,
          periodo_mas_viejo: null,
          periodo_mas_nuevo: null,
        };
        porEmpresa.set(fila.id, empresa);
      }

      const clave = `${fila.year}-${String(fila.mes).padStart(2, "0")}`;
      empresa.periodos_impagos += 1;
      empresa.subtotal_impago += base;
      empresa.interes_estimado_a_hoy += calculo.interes;
      empresa.saldo_sin_interes += base - parcial;
      empresa.total_estimado_a_hoy += calculo.importe - parcial;
      if (!empresa.periodo_mas_viejo || clave < empresa.periodo_mas_viejo) empresa.periodo_mas_viejo = clave;
      if (!empresa.periodo_mas_nuevo || clave > empresa.periodo_mas_nuevo) empresa.periodo_mas_nuevo = clave;
    }

    const empresas = [...porEmpresa.values()].map((empresa) => ({
      ...empresa,
      subtotal_impago: redondear2(empresa.subtotal_impago),
      interes_estimado_a_hoy: redondear2(empresa.interes_estimado_a_hoy),
      saldo_sin_interes: redondear2(empresa.saldo_sin_interes),
      total_estimado_a_hoy: redondear2(empresa.total_estimado_a_hoy),
    }));
    empresas.sort((a, b) => b.total_estimado_a_hoy - a.total_estimado_a_hoy);

    const totales = empresas.reduce(
      (acumulado, empresa) => ({
        subtotal_impago: acumulado.subtotal_impago + empresa.subtotal_impago,
        interes_estimado_a_hoy: acumulado.interes_estimado_a_hoy + empresa.interes_estimado_a_hoy,
        saldo_sin_interes: acumulado.saldo_sin_interes + empresa.saldo_sin_interes,
        total_estimado_a_hoy: acumulado.total_estimado_a_hoy + empresa.total_estimado_a_hoy,
        periodos_impagos: acumulado.periodos_impagos + empresa.periodos_impagos,
      }),
      { subtotal_impago: 0, interes_estimado_a_hoy: 0, saldo_sin_interes: 0, total_estimado_a_hoy: 0, periodos_impagos: 0 }
    );
    for (const clave of Object.keys(totales)) totales[clave] = redondear2(totales[clave]);

    return {
      fecha_calculo: fechaISO(hoy),
      tasa_diaria_porcentaje: porcentaje,
      cantidad_empresas_con_deuda: empresas.length,
      totales,
      empresas: empresas.slice(0, limit),
    };
  },

  listCategories: async () => {
    const [rows] = await pool.query(
      `SELECT id, nombre, sueldo_basico, presentismo, sueldo_futuro, fecha_vigencia,
              presentismo_futuro, fecha_vigencia_presentismo, modified AS ultima_modificacion
       FROM categorias ORDER BY id ASC;`
    );
    return rows.map((r) => ({
      ...r,
      sueldo_basico: aNumero(r.sueldo_basico),
      presentismo: aNumero(r.presentismo),
      sueldo_futuro: aNumero(r.sueldo_futuro),
      presentismo_futuro: aNumero(r.presentismo_futuro),
      fecha_vigencia: fechaISO(r.fecha_vigencia),
      fecha_vigencia_presentismo: fechaISO(r.fecha_vigencia_presentismo),
      ultima_modificacion: fechaISO(r.ultima_modificacion),
    }));
  },

  getRate: async () => {
    const [rows] = await pool.query(
      `SELECT id, porcentaje, modified FROM tasa ORDER BY id ASC LIMIT 1;`
    );
    if (!rows[0]) return null;
    return { ...rows[0], porcentaje: aNumero(rows[0].porcentaje), modified: fechaISO(rows[0].modified) };
  },

  // Mismas definiciones que el Dashboard del panel (dashboardModel.getAll),
  // para que los números de Nacho coincidan con los que el personal ve ahí.
  generalStats: async () => {
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM empresas WHERE estado = 'Activo') AS empresas_activas,
        (SELECT COUNT(*) FROM empresas WHERE estado = 'Inactivo') AS empresas_inactivas,
        (SELECT COUNT(*) FROM empresas WHERE estado = 'Pendiente') AS empresas_pendientes_de_aprobacion,
        (SELECT COUNT(DISTINCT u.id)
           FROM usuarios u
           JOIN empleados e ON u.id = e.usuario_id
           JOIN contratos c ON e.id = c.empleado_id
           JOIN empresas em ON c.empresa_id = em.id
          WHERE u.estado = '1' AND u.rol = 'empleado'
            AND c.estado = '1' AND c.deleted IS NULL
            AND em.estado = 'Activo') AS empleados_activos,
        (SELECT COUNT(DISTINCT e.id)
           FROM empleados e
           JOIN usuarios u ON e.usuario_id = u.id
           JOIN contratos c ON e.id = c.empleado_id
           JOIN empresas em ON c.empresa_id = em.id
          WHERE u.estado = '1' AND u.rol = 'empleado'
            AND c.estado = '1' AND c.deleted IS NULL
            AND e.sindicato_activo = 1
            AND em.estado = 'Activo') AS empleados_afiliados,
        (SELECT COUNT(*) FROM (
           SELECT dj.id FROM declaraciones_juradas dj ${JOIN_VIGENTE}
         ) v) AS declaraciones_vigentes,
        (SELECT COUNT(*) FROM declaraciones_juradas) AS declaraciones_totales_incluyendo_rectificadas,
        (SELECT COUNT(*) FROM (
           SELECT dj.id FROM declaraciones_juradas dj ${JOIN_VIGENTE}
            WHERE dj.estado IN (0, 2) AND dj.vencimiento < CURDATE()
         ) p) AS declaraciones_vencidas_impagas;
    `);
    return {
      ...stats,
      criterio: "Empresas activas = estado 'Activo'. Empleados activos = contrato vigente en empresa activa y usuario habilitado (mismo criterio que el Dashboard).",
    };
  },

  // SQL libre de solo lectura. La validación vive en utils/chatbotSql.js;
  // acá sólo se ejecuta con un LIMIT ya garantizado por el validador.
  runReadOnlyQuery: async (sql) => {
    const connection = await pool.getConnection();
    try {
      // La sesión queda en solo lectura: aunque algo se escape del validador,
      // MySQL rechaza cualquier escritura. Y con tope de tiempo.
      await connection.query("SET SESSION TRANSACTION READ ONLY;");
      await connection.query(`SET SESSION MAX_EXECUTION_TIME = ${MAX_EXECUTION_TIME_MS};`);
      await connection.beginTransaction();
      const [rows] = await connection.query(sql);
      await connection.rollback();
      return rows;
    } finally {
      // Devolvemos la sesión a su modo normal antes de soltarla al pool.
      try {
        await connection.query("SET SESSION TRANSACTION READ WRITE;");
        await connection.query("SET SESSION MAX_EXECUTION_TIME = 0;");
      } catch (_) {
        /* la conexión se descarta igual */
      }
      connection.release();
    }
  },

  // -------------------------------------------------------------------------
  // Escrituras — sólo se llaman desde la confirmación explícita del admin
  // -------------------------------------------------------------------------
  updateCompany: async (id, campos) => {
    const columnas = Object.keys(campos);
    if (!columnas.length) return 0;
    const sets = columnas.map((c) => `\`${c}\` = ?`).join(", ");
    const [res] = await pool.query(
      `UPDATE empresas SET ${sets}, modified = NOW() WHERE id = ?;`,
      [...columnas.map((c) => campos[c]), id]
    );
    return res.affectedRows;
  },

  updateRate: async (id, porcentaje) => {
    const [res] = await pool.query(
      `UPDATE tasa SET porcentaje = ?, modified = NOW() WHERE id = ?;`,
      [porcentaje, id]
    );
    return res.affectedRows;
  },

  updateCategory: async (id, campos) => {
    const columnas = Object.keys(campos);
    if (!columnas.length) return 0;
    const sets = columnas.map((c) => `\`${c}\` = ?`).join(", ");
    const [res] = await pool.query(
      `UPDATE categorias SET ${sets}, modified = NOW() WHERE id = ?;`,
      [...columnas.map((c) => campos[c]), id]
    );
    return res.affectedRows;
  },

  updateEmployee: async (id, campos) => {
    const columnas = Object.keys(campos);
    if (!columnas.length) return 0;
    const sets = columnas.map((c) => `\`${c}\` = ?`).join(", ");
    const [res] = await pool.query(
      `UPDATE empleados SET ${sets} WHERE id = ?;`,
      [...columnas.map((c) => campos[c]), id]
    );
    return res.affectedRows;
  },

  getCategory: async (id) => {
    const [rows] = await pool.query(
      `SELECT id, nombre, sueldo_basico, presentismo FROM categorias WHERE id = ?;`,
      [id]
    );
    if (!rows[0]) return null;
    return { ...rows[0], sueldo_basico: aNumero(rows[0].sueldo_basico), presentismo: aNumero(rows[0].presentismo) };
  },

  getEmployee: async (id) => {
    const [rows] = await pool.query(
      `SELECT emp.id, emp.cuil, emp.sindicato_activo, emp.categoria_id,
              u.nombre, u.apellido, u.email
       FROM empleados emp
       LEFT JOIN usuarios u ON u.id = emp.usuario_id
       WHERE emp.id = ?;`,
      [id]
    );
    return rows[0] ?? null;
  },
};

export { describirEstado };
export default chatbotModel;
