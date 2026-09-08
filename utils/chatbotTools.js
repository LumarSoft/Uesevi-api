import { randomUUID } from "crypto";
import chatbotModel, { TABLAS_PERMITIDAS } from "../models/chatbotModel.js";
import { validarConsultaLectura, SqlInvalido, LIMITE_FILAS } from "./chatbotSql.js";

// ---------------------------------------------------------------------------
// Propuestas de escritura pendientes de confirmación
//
// El modelo NUNCA escribe en la base. Cuando pide un cambio, se guarda acá una
// propuesta con vencimiento y se le devuelve el id; recién cuando el admin
// aprieta "Confirmar" en el panel, `ejecutarPropuesta` corre el UPDATE.
// Se guardan en memoria a propósito (mismo criterio que los códigos de reseteo
// de `loginController`): son efímeras y de un solo uso.
// ---------------------------------------------------------------------------
const propuestas = new Map();
const VIGENCIA_PROPUESTA_MS = 15 * 60 * 1000;

const SIN_CAMBIOS =
  "No hay ningún campo para modificar: mandá únicamente los campos que cambian, " +
  "con su valor nuevo (no reenvíes los que quedan igual ni los mandes vacíos).";

const limpiarPropuestasVencidas = () => {
  const ahora = Date.now();
  for (const [id, propuesta] of propuestas) {
    if (propuesta.expiraEn < ahora) propuestas.delete(id);
  }
};

const registrarPropuesta = ({ usuarioId, tipo, resumen, tabla, registroId, cambios, estadoActual }) => {
  limpiarPropuestasVencidas();

  // El modelo a veces pide el mismo cambio dos veces en la misma vuelta:
  // reutilizamos la propuesta vigente en lugar de mostrar dos tarjetas iguales.
  const huella = JSON.stringify({ tabla, registroId, cambios });
  for (const vigente of propuestas.values()) {
    if (
      vigente.usuarioId === usuarioId &&
      JSON.stringify({ tabla: vigente.tabla, registroId: vigente.registroId, cambios: vigente.cambios }) === huella
    ) {
      return vigente;
    }
  }

  const id = randomUUID();
  const propuesta = {
    id,
    usuarioId,
    tipo,
    resumen,
    tabla,
    registroId,
    cambios,
    estadoActual,
    expiraEn: Date.now() + VIGENCIA_PROPUESTA_MS,
  };
  propuestas.set(id, propuesta);
  return propuesta;
};

export const obtenerPropuesta = (id, usuarioId) => {
  limpiarPropuestasVencidas();
  const propuesta = propuestas.get(id);
  if (!propuesta) return null;
  // Una propuesta sólo la puede confirmar el mismo admin que la generó.
  if (propuesta.usuarioId !== usuarioId) return null;
  return propuesta;
};

export const descartarPropuesta = (id) => propuestas.delete(id);

export const ejecutarPropuesta = async (propuesta) => {
  switch (propuesta.tabla) {
    case "empresas":
      return chatbotModel.updateCompany(propuesta.registroId, propuesta.cambios);
    case "categorias":
      return chatbotModel.updateCategory(propuesta.registroId, propuesta.cambios);
    case "tasa":
      return chatbotModel.updateRate(propuesta.registroId, propuesta.cambios.porcentaje);
    case "empleados":
      return chatbotModel.updateEmployee(propuesta.registroId, propuesta.cambios);
    default:
      throw new Error(`Tabla no soportada para escritura: ${propuesta.tabla}`);
  }
};

// ---------------------------------------------------------------------------
// Definiciones de herramientas expuestas al modelo
// ---------------------------------------------------------------------------
export const definicionesHerramientas = [
  {
    type: "function",
    name: "buscar_empresa",
    description:
      "Busca empresas por nombre, CUIT o email. Es el primer paso para casi cualquier consulta sobre una empresa: devuelve el id que necesitan las demás herramientas. Si hay varias coincidencias, mostrale las opciones al usuario en vez de adivinar.",
    parameters: {
      type: "object",
      properties: {
        texto: { type: "string", description: "Nombre parcial, CUIT o email de la empresa." },
        estado: {
          type: "string",
          enum: ["Activo", "Pendiente"],
          description: "Filtro opcional por estado de la empresa.",
        },
        limite: { type: "integer", description: "Máximo de resultados (default 15)." },
      },
      required: ["texto"],
    },
  },
  {
    type: "function",
    name: "detalle_empresa",
    description:
      "Datos completos de una empresa por id: CUIT, nombre, email de contacto, teléfono, domicilio, estado y cantidad de empleados activos.",
    parameters: {
      type: "object",
      properties: { id_empresa: { type: "integer" } },
      required: ["id_empresa"],
    },
  },
  {
    type: "function",
    name: "ultima_declaracion_empresa",
    description:
      "Última declaración jurada vigente de una empresa (el período más reciente que declaró), con importe, vencimiento, fecha de pago y estado. Además informa qué períodos le faltan declarar.",
    parameters: {
      type: "object",
      properties: { id_empresa: { type: "integer" } },
      required: ["id_empresa"],
    },
  },
  {
    type: "function",
    name: "listar_declaraciones_empresa",
    description:
      "Lista las declaraciones juradas vigentes de una empresa, opcionalmente filtradas por año, mes o estado (0 pendiente, 1 pagada, 2 pago parcial).",
    parameters: {
      type: "object",
      properties: {
        id_empresa: { type: "integer" },
        year: { type: "integer" },
        mes: { type: "integer", description: "1 a 12." },
        estado: { type: "integer", enum: [0, 1, 2] },
        limite: { type: "integer", description: "Default 24." },
      },
      required: ["id_empresa"],
    },
  },
  {
    type: "function",
    name: "buscar_empleado",
    description:
      "Busca empleados por CUIL, nombre, apellido o email. Devuelve la empresa en la que está trabajando actualmente (contrato activo), su categoría y si está afiliado al sindicato.",
    parameters: {
      type: "object",
      properties: {
        texto: { type: "string" },
        limite: { type: "integer", description: "Default 15." },
      },
      required: ["texto"],
    },
  },
  {
    type: "function",
    name: "listar_empleados_empresa",
    description: "Lista los empleados de una empresa con su categoría, puesto y afiliación.",
    parameters: {
      type: "object",
      properties: {
        id_empresa: { type: "integer" },
        solo_activos: { type: "boolean", description: "Default true: sólo contratos vigentes." },
        limite: { type: "integer", description: "Default 100." },
      },
      required: ["id_empresa"],
    },
  },
  {
    type: "function",
    name: "empresas_deudoras",
    description:
      "Empresas con declaraciones juradas vencidas e impagas, ordenadas por deuda aproximada.",
    parameters: {
      type: "object",
      properties: { limite: { type: "integer", description: "Default 20." } },
    },
  },
  {
    type: "function",
    name: "listar_categorias",
    description:
      "Escala salarial: todas las categorías con su sueldo básico, presentismo y los valores futuros programados. La categoría id 1 es la general, cuyo básico define el FAS.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "tasa_interes",
    description: "Tasa de interés diaria vigente por mora.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "estadisticas_generales",
    description:
      "Números globales del sistema: empresas activas y pendientes, empleados activos, afiliados y total de declaraciones.",
    parameters: { type: "object", properties: {} },
  },
  {
    type: "function",
    name: "consulta_sql",
    description:
      `Ejecuta una consulta SELECT de solo lectura cuando ninguna de las otras herramientas alcanza (agregaciones, cruces, rankings, filtros raros). ` +
      `Tablas disponibles: ${TABLAS_PERMITIDAS.join(", ")}. ` +
      `Es MySQL 8: usá LIKE (no existe ILIKE) — las comparaciones de texto ya son case-insensitive. ` +
      `Reglas: una sola sentencia SELECT (o WITH ... SELECT), sin comentarios, sin columnas de contraseña, máximo ${LIMITE_FILAS} filas. ` +
      `Recordá que un período de declaración jurada puede tener varias filas (rectificaciones) y sólo vale la de mayor "rectificada": usá el INNER JOIN con MAX(rectificada) agrupado por empresa_id, mes y year. ` +
      `Los contratos vigentes son los que tienen deleted IS NULL y estado = '1'. Los nombres de empleados y empresas-usuario están en la tabla usuarios.`,
    parameters: {
      type: "object",
      properties: {
        sql: { type: "string", description: "La consulta SELECT completa." },
        explicacion: {
          type: "string",
          description: "Una línea en español explicando qué busca la consulta.",
        },
      },
      required: ["sql", "explicacion"],
    },
  },
  {
    type: "function",
    name: "proponer_actualizar_empresa",
    description:
      "Propone modificar datos de una empresa. NO ejecuta el cambio: registra una propuesta que el administrador tiene que confirmar con un botón en el panel. IMPORTANTE: mandá únicamente los campos que se modifican; no reenvíes los que quedan igual ni los mandes vacíos. Llamala una sola vez por cambio.",
    parameters: {
      type: "object",
      properties: {
        id_empresa: { type: "integer" },
        nombre: { type: "string" },
        email_contacto: { type: "string" },
        telefono: { type: "string" },
        domicilio: { type: "string" },
        ciudad: { type: "string" },
        estado: { type: "string", enum: ["Activo", "Pendiente"] },
      },
      required: ["id_empresa"],
    },
  },
  {
    type: "function",
    name: "proponer_actualizar_categoria",
    description:
      "Propone cambiar el sueldo básico o el presentismo de una categoría. Mandá sólo el campo que cambia. NO ejecuta el cambio: queda pendiente de confirmación del administrador. Avisale al usuario que esto afecta el cálculo del aporte solidario de las declaraciones nuevas (las históricas no se recalculan).",
    parameters: {
      type: "object",
      properties: {
        id_categoria: { type: "integer" },
        sueldo_basico: { type: "number" },
        presentismo: { type: "number" },
      },
      required: ["id_categoria"],
    },
  },
  {
    type: "function",
    name: "proponer_actualizar_tasa",
    description:
      "Propone cambiar la tasa de interés diaria por mora. NO ejecuta el cambio: queda pendiente de confirmación del administrador.",
    parameters: {
      type: "object",
      properties: { porcentaje: { type: "number", description: "Tasa diaria en porcentaje." } },
      required: ["porcentaje"],
    },
  },
  {
    type: "function",
    name: "proponer_actualizar_empleado",
    description:
      "Propone cambiar la categoría por defecto o la afiliación sindical de un empleado. NO ejecuta el cambio: queda pendiente de confirmación del administrador.",
    parameters: {
      type: "object",
      properties: {
        id_empleado: { type: "integer" },
        categoria_id: { type: "integer" },
        sindicato_activo: { type: "boolean" },
      },
      required: ["id_empleado"],
    },
  },
];

export const NOMBRES_HERRAMIENTAS_ESCRITURA = new Set([
  "proponer_actualizar_empresa",
  "proponer_actualizar_categoria",
  "proponer_actualizar_tasa",
  "proponer_actualizar_empleado",
]);

/**
 * Arma el objeto de cambios comparando contra el registro actual.
 *
 * Los modelos tienden a reenviar el objeto entero, con strings vacíos en los
 * campos que no querían tocar: sin este filtro una propuesta de "cambiale el
 * email" terminaría borrando el nombre, el teléfono y el domicilio. Por eso se
 * descarta todo lo vacío y todo lo que ya vale igual que en la base.
 */
const calcularCambios = (input, mapa, actual) => {
  const cambios = {};
  for (const [clave, columna] of Object.entries(mapa)) {
    const valor = input[clave];
    if (valor === undefined || valor === null) continue;
    if (typeof valor === "string" && !valor.trim()) continue;

    const nuevo = typeof valor === "string" ? valor.trim() : valor;
    const previo = actual?.[columna];
    if (previo !== undefined && previo !== null && String(previo) === String(nuevo)) continue;

    cambios[columna] = nuevo;
  }
  return cambios;
};

const respuestaPropuesta = (propuesta, estadoActual, cambios) => ({
  propuesta_registrada: true,
  id_propuesta: propuesta.id,
  resumen: propuesta.resumen,
  valores_actuales: estadoActual,
  valores_nuevos: cambios,
  siguiente_paso:
    "Explicale al usuario exactamente qué va a cambiar y pedile que use el botón Confirmar del panel. No vuelvas a llamar a esta herramienta para el mismo cambio.",
});

/**
 * Ejecuta una herramienta y devuelve un objeto serializable para el tool_result.
 * `contexto` trae { usuarioId } para poder atribuir las propuestas.
 */
export const ejecutarHerramienta = async (nombre, input, contexto) => {
  switch (nombre) {
    // ---------------- lecturas ----------------
    case "buscar_empresa": {
      const empresas = await chatbotModel.searchCompanies({
        texto: input.texto ?? "",
        estado: input.estado ?? null,
        limit: input.limite ?? 15,
      });
      return { cantidad: empresas.length, empresas };
    }

    case "detalle_empresa": {
      const empresa = await chatbotModel.getCompany(input.id_empresa);
      return empresa ?? { error: "No existe una empresa con ese id." };
    }

    case "ultima_declaracion_empresa": {
      const [ultima, periodos] = await Promise.all([
        chatbotModel.lastStatement(input.id_empresa),
        chatbotModel.missingPeriods(input.id_empresa),
      ]);
      if (!ultima) {
        return { ultima_declaracion: null, mensaje: "La empresa no tiene declaraciones juradas cargadas." };
      }
      return {
        ultima_declaracion: ultima,
        periodos_faltantes: periodos.faltantes,
        rango_controlado: { desde: periodos.desde, hasta: periodos.hasta },
      };
    }

    case "listar_declaraciones_empresa": {
      const declaraciones = await chatbotModel.listStatements({
        empresaId: input.id_empresa,
        year: input.year ?? null,
        mes: input.mes ?? null,
        estado: input.estado ?? null,
        limit: input.limite ?? 24,
      });
      return { cantidad: declaraciones.length, declaraciones };
    }

    case "buscar_empleado": {
      const empleados = await chatbotModel.searchEmployees({
        texto: input.texto ?? "",
        limit: input.limite ?? 15,
      });
      return { cantidad: empleados.length, empleados };
    }

    case "listar_empleados_empresa": {
      const empleados = await chatbotModel.listCompanyEmployees({
        empresaId: input.id_empresa,
        soloActivos: input.solo_activos !== false,
        limit: input.limite ?? 100,
      });
      return { cantidad: empleados.length, empleados };
    }

    case "empresas_deudoras": {
      const empresas = await chatbotModel.debtorCompanies({ limit: input.limite ?? 20 });
      return { cantidad: empresas.length, empresas };
    }

    case "listar_categorias":
      return { categorias: await chatbotModel.listCategories() };

    case "tasa_interes": {
      const tasa = await chatbotModel.getRate();
      return tasa
        ? { ...tasa, nota: "El porcentaje es diario: interés = subtotal × porcentaje × días de atraso / 100." }
        : { error: "No hay tasa cargada." };
    }

    case "estadisticas_generales":
      return await chatbotModel.generalStats();

    case "consulta_sql": {
      let sql;
      try {
        sql = validarConsultaLectura(input.sql);
      } catch (error) {
        if (error instanceof SqlInvalido) {
          return { error: error.message, sugerencia: "Corregí la consulta y volvé a intentar." };
        }
        throw error;
      }
      const filas = await chatbotModel.runReadOnlyQuery(sql);
      return { sql_ejecutado: sql, cantidad: filas.length, filas };
    }

    // ---------------- escrituras (sólo propuestas) ----------------
    case "proponer_actualizar_empresa": {
      const empresa = await chatbotModel.getCompany(input.id_empresa);
      if (!empresa) return { error: "No existe una empresa con ese id." };

      const cambios = calcularCambios(
        input,
        {
          nombre: "nombre",
          email_contacto: "email_contacto",
          telefono: "telefono",
          domicilio: "domicilio",
          ciudad: "ciudad",
          estado: "estado",
        },
        empresa
      );
      if (!Object.keys(cambios).length) {
        return { error: SIN_CAMBIOS };
      }

      const actuales = Object.fromEntries(
        Object.keys(cambios).map((columna) => [columna, empresa[columna]])
      );
      const propuesta = registrarPropuesta({
        usuarioId: contexto.usuarioId,
        tipo: "Actualizar empresa",
        resumen: `Actualizar ${Object.keys(cambios).join(", ")} de la empresa "${empresa.nombre}" (CUIT ${empresa.cuit}).`,
        tabla: "empresas",
        registroId: empresa.id,
        cambios,
        estadoActual: actuales,
      });
      return respuestaPropuesta(propuesta, actuales, cambios);
    }

    case "proponer_actualizar_categoria": {
      const categoria = await chatbotModel.getCategory(input.id_categoria);
      if (!categoria) return { error: "No existe una categoría con ese id." };

      const cambios = calcularCambios(
        input,
        { sueldo_basico: "sueldo_basico", presentismo: "presentismo" },
        categoria
      );
      if (!Object.keys(cambios).length) {
        return { error: SIN_CAMBIOS };
      }

      const actuales = Object.fromEntries(
        Object.keys(cambios).map((columna) => [columna, categoria[columna]])
      );
      const propuesta = registrarPropuesta({
        usuarioId: contexto.usuarioId,
        tipo: "Actualizar categoría",
        resumen: `Actualizar ${Object.keys(cambios).join(", ")} de la categoría "${categoria.nombre}".`,
        tabla: "categorias",
        registroId: categoria.id,
        cambios,
        estadoActual: actuales,
      });
      return respuestaPropuesta(propuesta, actuales, cambios);
    }

    case "proponer_actualizar_tasa": {
      const tasa = await chatbotModel.getRate();
      if (!tasa) return { error: "No hay una tasa cargada para modificar." };

      if (Number(tasa.porcentaje) === Number(input.porcentaje)) {
        return { error: SIN_CAMBIOS };
      }

      const cambios = { porcentaje: input.porcentaje };
      const propuesta = registrarPropuesta({
        usuarioId: contexto.usuarioId,
        tipo: "Actualizar tasa de interés",
        resumen: `Cambiar la tasa diaria de ${tasa.porcentaje} a ${input.porcentaje}.`,
        tabla: "tasa",
        registroId: tasa.id,
        cambios,
        estadoActual: { porcentaje: tasa.porcentaje },
      });
      return respuestaPropuesta(propuesta, { porcentaje: tasa.porcentaje }, cambios);
    }

    case "proponer_actualizar_empleado": {
      const empleado = await chatbotModel.getEmployee(input.id_empleado);
      if (!empleado) return { error: "No existe un empleado con ese id." };

      const cambios = {};
      if (input.categoria_id !== undefined && input.categoria_id !== null) {
        const categoria = await chatbotModel.getCategory(input.categoria_id);
        if (!categoria) return { error: "La categoría indicada no existe." };
        if (Number(empleado.categoria_id) !== Number(input.categoria_id)) {
          cambios.categoria_id = input.categoria_id;
        }
      }
      if (input.sindicato_activo !== undefined && input.sindicato_activo !== null) {
        const nuevo = input.sindicato_activo ? 1 : 0;
        if (Number(empleado.sindicato_activo) !== nuevo) cambios.sindicato_activo = nuevo;
      }
      if (!Object.keys(cambios).length) {
        return { error: SIN_CAMBIOS };
      }

      const actuales = Object.fromEntries(
        Object.keys(cambios).map((columna) => [columna, empleado[columna]])
      );
      const nombreCompleto = [empleado.nombre, empleado.apellido].filter(Boolean).join(" ");
      const propuesta = registrarPropuesta({
        usuarioId: contexto.usuarioId,
        tipo: "Actualizar empleado",
        resumen: `Actualizar ${Object.keys(cambios).join(", ")} del empleado ${nombreCompleto || empleado.cuil} (CUIL ${empleado.cuil}).`,
        tabla: "empleados",
        registroId: empleado.id,
        cambios,
        estadoActual: actuales,
      });
      return respuestaPropuesta(propuesta, actuales, cambios);
    }

    default:
      return { error: `Herramienta desconocida: ${nombre}` };
  }
};
