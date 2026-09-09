import { randomUUID } from "crypto";
import chatbotModel, {
  TABLAS_PERMITIDAS,
  COLUMNAS_PROHIBIDAS,
  ESTADOS_EMPRESA,
} from "../models/chatbotModel.js";
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
      "Busca empresas por nombre, CUIT o email. Es el primer paso para casi cualquier consulta sobre una empresa: devuelve el id que necesitan las demás herramientas. Si no hay coincidencia exacta devuelve las más parecidas marcadas como 'coincidencia_aproximada': en ese caso confirmá con el usuario antes de dar datos como si fueran de esa empresa. Si hay varias coincidencias, mostrale las opciones al usuario en vez de adivinar.",
    parameters: {
      type: "object",
      properties: {
        texto: { type: "string", description: "Nombre parcial, CUIT o email de la empresa." },
        estado: {
          type: "string",
          enum: ESTADOS_EMPRESA,
          description: "Filtro opcional por estado de la empresa (Activo, Inactivo o Pendiente de aprobación).",
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
      "Datos completos de una empresa por id: CUIT, nombre, email de contacto, teléfono, domicilio, estado, cantidad de empleados activos y afiliados, y el rango de períodos que tiene declarados.",
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
      "Última declaración jurada vigente de una empresa (el período más reciente que declaró), con importe, desglose FAS/solidario/sindical, vencimiento, estado y si está confirmada como pagada en el Panel de Pagos. Además informa qué períodos le faltan declarar y cuáles de esos ya vencieron.",
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
      "Lista las declaraciones juradas vigentes de una empresa (una por período, ya resuelta la rectificación vigente), opcionalmente filtradas por año, mes o estado (0 pendiente, 1 pagada, 2 pago parcial). Cada una trae importe, desglose y estado de pago en el panel.",
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
    name: "detalle_declaracion",
    description:
      "Detalle completo de UNA declaración jurada: por id de declaración, o por empresa + mes + año (en ese caso devuelve la vigente del período). Incluye subtotal, interés, importe, vencimiento, fecha de pago, estado, cantidad de empleados y afiliados declarados, el desglose congelado FAS / aporte solidario / aporte sindical (tabla auxiliar) y la confirmación de pago del Panel de Pagos. Usala siempre que pregunten por el desglose o por un período puntual.",
    parameters: {
      type: "object",
      properties: {
        id_declaracion: { type: "integer" },
        id_empresa: { type: "integer" },
        mes: { type: "integer", description: "1 a 12. Se usa junto con id_empresa y year." },
        year: { type: "integer" },
      },
    },
  },
  {
    type: "function",
    name: "empleados_declaracion",
    description:
      "Empleados incluidos en una declaración jurada (foto congelada de la tabla sueldos): CUIL, nombre, categoría, si estaba afiliado al declarar, sueldo declarado, adicionales, y el básico/presentismo de la categoría al momento de la carga. Los aportes individuales por empleado NO están guardados; sólo existe el desglose total de la declaración.",
    parameters: {
      type: "object",
      properties: {
        id_declaracion: { type: "integer" },
        limite: { type: "integer", description: "Default 200." },
      },
      required: ["id_declaracion"],
    },
  },
  {
    type: "function",
    name: "deuda_empresa",
    description:
      "Deuda actual de una empresa: todas sus declaraciones juradas vigentes impagas (estado pendiente o pago parcial, no confirmadas en el Panel de Pagos), con el interés por mora ESTIMADO A HOY calculado con la misma fórmula que usa el Panel de Pagos (subtotal × tasa diaria × días de atraso / 100), más los totales y los períodos que directamente no declaró. Usala siempre que pregunten cuánto debe o cuánto tiene que pagar una empresa; no calcules intereses vos.",
    parameters: {
      type: "object",
      properties: { id_empresa: { type: "integer" } },
      required: ["id_empresa"],
    },
  },
  {
    type: "function",
    name: "buscar_empleado",
    description:
      "Busca empleados por CUIL, nombre, apellido o email. Devuelve la empresa en la que está trabajando actualmente (contrato vigente), su categoría y si está afiliado al sindicato.",
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
    description:
      "Lista los empleados de una empresa con su categoría, puesto y afiliación. Devuelve también el total real aunque la lista esté limitada.",
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
      "Empresas con declaraciones juradas vencidas e impagas (no confirmadas en el Panel de Pagos), ordenadas por saldo. El saldo NO incluye interés por mora: para el monto actualizado de una empresa puntual usá deuda_empresa.",
    parameters: {
      type: "object",
      properties: {
        limite: { type: "integer", description: "Default 20." },
        incluir_inactivas: { type: "boolean", description: "Default false: sólo empresas con estado Activo." },
      },
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
      "Números globales del sistema con el mismo criterio que el Dashboard: empresas activas/inactivas/pendientes, empleados activos, afiliados, declaraciones vigentes y declaraciones vencidas impagas.",
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
      `declaraciones_juradas.estado puede ser NULL en filas históricas migradas (2020-2023): no las cuentes como pendientes. ` +
      `Los contratos vigentes son los que tienen deleted IS NULL y estado = '1'. Los nombres de empleados y empresas-usuario están en la tabla usuarios. ` +
      `Columnas útiles — sueldos: id, contrato_id, declaraciones_jurada_id, mes, year, monto, adicional, adicional_norem, remunerativo_adicional, sueldo_basico, presentismo, categoria_id, sindicato_activo, deleted. ` +
      `declaraciones_juradas: id, empresa_id, mes, year, rectificada, subtotal, interes, importe, vencimiento, fecha_pago, pago_parcial, estado, fecha. ` +
      `auxiliar: id_declaracion, id_empresa, fas, solidario, sindical, total. pagos_panel: declaracion_jurada_id, empresa_id, mes, year, fecha_pago, estado_pago, total, aplica_interes. ` +
      `empleados: id, cuil, usuario_id, sindicato_activo, categoria_id, numero_socio. contratos: id, empleado_id, empresa_id, puesto, fecha_ingreso, estado, deleted. ` +
      `Pedí siempre las columnas que necesitás (evitá SELECT *).`,
    parameters: {
      type: "object",
      properties: {
        sql: { type: "string", description: "La consulta SELECT completa." },
        explicacion: {
          type: "string",
          description: "Una línea en español, para mostrarle al usuario, explicando qué busca la consulta.",
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
        estado: { type: "string", enum: ESTADOS_EMPRESA },
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

// ---------------------------------------------------------------------------
// Textos para el panel: qué está haciendo Nacho mientras corre cada herramienta
// y un resumen corto de lo que encontró. Se mandan por el stream de eventos y
// el front los muestra tal cual.
// ---------------------------------------------------------------------------
const comillas = (texto) => (texto ? `«${String(texto).trim().slice(0, 60)}»` : "");

const plural = (n, singular, pluralTexto) => `${n} ${n === 1 ? singular : pluralTexto}`;

export const describirHerramienta = (nombre, input = {}) => {
  switch (nombre) {
    case "buscar_empresa":
      return `Buscando la empresa ${comillas(input.texto)}`;
    case "detalle_empresa":
      return "Leyendo los datos de la empresa";
    case "ultima_declaracion_empresa":
      return "Buscando la última declaración jurada";
    case "listar_declaraciones_empresa":
      return input.year ? `Listando declaraciones de ${input.year}` : "Listando declaraciones juradas";
    case "detalle_declaracion":
      return input.mes && input.year
        ? `Abriendo la declaración de ${input.mes}/${input.year}`
        : "Abriendo el detalle de la declaración";
    case "empleados_declaracion":
      return "Leyendo los empleados declarados";
    case "deuda_empresa":
      return "Calculando la deuda con intereses a hoy";
    case "buscar_empleado":
      return `Buscando al empleado ${comillas(input.texto)}`;
    case "listar_empleados_empresa":
      return "Listando los empleados de la empresa";
    case "empresas_deudoras":
      return "Buscando empresas con deuda vencida";
    case "listar_categorias":
      return "Consultando la escala salarial";
    case "tasa_interes":
      return "Consultando la tasa de interés";
    case "estadisticas_generales":
      return "Calculando las estadísticas generales";
    case "consulta_sql":
      return input.explicacion ? `Consultando la base: ${input.explicacion}` : "Consultando la base de datos";
    case "proponer_actualizar_empresa":
      return "Preparando una propuesta de cambio en la empresa";
    case "proponer_actualizar_categoria":
      return "Preparando una propuesta de cambio en la categoría";
    case "proponer_actualizar_tasa":
      return "Preparando una propuesta de cambio de tasa";
    case "proponer_actualizar_empleado":
      return "Preparando una propuesta de cambio en el empleado";
    default:
      return "Consultando la base de datos";
  }
};

export const resumirResultado = (nombre, resultado) => {
  if (!resultado || typeof resultado !== "object") return "";
  if (resultado.error) return "Sin resultado";
  switch (nombre) {
    case "buscar_empresa":
      if (!resultado.cantidad) return "No encontré ninguna empresa";
      return resultado.coincidencia_aproximada
        ? `${plural(resultado.cantidad, "coincidencia aproximada", "coincidencias aproximadas")}`
        : `${plural(resultado.cantidad, "empresa encontrada", "empresas encontradas")}`;
    case "detalle_empresa":
      return resultado.nombre ? `${resultado.nombre}` : "";
    case "ultima_declaracion_empresa":
      return resultado.ultima_declaracion
        ? `Período ${resultado.ultima_declaracion.periodo}`
        : "Sin declaraciones cargadas";
    case "listar_declaraciones_empresa":
      return plural(resultado.cantidad ?? 0, "declaración", "declaraciones");
    case "detalle_declaracion":
      return resultado.periodo ? `Período ${resultado.periodo}` : "";
    case "empleados_declaracion":
      return plural(resultado.cantidad ?? 0, "empleado declarado", "empleados declarados");
    case "deuda_empresa":
      return plural(resultado.cantidad_periodos_impagos ?? 0, "período impago", "períodos impagos");
    case "buscar_empleado":
      return resultado.cantidad
        ? plural(resultado.cantidad, "empleado encontrado", "empleados encontrados")
        : "No encontré ningún empleado";
    case "listar_empleados_empresa":
      return plural(resultado.total ?? resultado.cantidad ?? 0, "empleado", "empleados");
    case "empresas_deudoras":
      return plural(resultado.cantidad ?? 0, "empresa con deuda", "empresas con deuda");
    case "listar_categorias":
      return plural(resultado.categorias?.length ?? 0, "categoría", "categorías");
    case "tasa_interes":
      return resultado.porcentaje !== undefined ? `${resultado.porcentaje}% diario` : "";
    case "estadisticas_generales":
      return "Listo";
    case "consulta_sql":
      return plural(resultado.cantidad ?? 0, "fila", "filas");
    default:
      return resultado.propuesta_registrada ? "Propuesta lista para confirmar" : "";
  }
};

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

// El validador impide nombrar columnas sensibles, pero un SELECT * sobre
// usuarios las traería igual: se sacan de cada fila antes de devolverlas.
const quitarColumnasSensibles = (filas) =>
  filas.map((fila) => {
    const limpia = { ...fila };
    for (const columna of COLUMNAS_PROHIBIDAS) delete limpia[columna];
    return limpia;
  });

const NOTA_APROXIMADA =
  "No hubo coincidencia exacta: estas empresas se parecen a lo que escribió el usuario. " +
  "Confirmá con el usuario cuál es antes de responder datos de esa empresa (o usá la que tiene mayor similitud si es claramente la única).";

/**
 * Ejecuta una herramienta y devuelve un objeto serializable para el tool_result.
 * `contexto` trae { usuarioId } para poder atribuir las propuestas.
 */
export const ejecutarHerramienta = async (nombre, input, contexto) => {
  switch (nombre) {
    // ---------------- lecturas ----------------
    case "buscar_empresa": {
      const { empresas, aproximada } = await chatbotModel.searchCompanies({
        texto: input.texto ?? "",
        estado: input.estado ?? null,
        limit: input.limite ?? 15,
      });
      return {
        cantidad: empresas.length,
        coincidencia_aproximada: aproximada,
        ...(aproximada && empresas.length ? { nota: NOTA_APROXIMADA } : {}),
        empresas,
      };
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
      const vencidos = periodos.faltantes.filter((p) => p.vencido);
      const enTermino = periodos.faltantes.filter((p) => !p.vencido);
      return {
        ultima_declaracion: ultima,
        periodos_sin_declarar_vencidos: vencidos,
        periodos_sin_declarar_en_termino: enTermino,
        rango_controlado: { desde: periodos.desde, hasta: periodos.hasta },
        nota: "Un período está 'en término' hasta el último día del mes siguiente; no es deuda todavía.",
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

    case "detalle_declaracion": {
      if (input.id_declaracion) {
        const declaracion = await chatbotModel.getStatement(input.id_declaracion);
        return declaracion ?? { error: "No existe una declaración jurada con ese id." };
      }
      if (input.id_empresa && input.mes && input.year) {
        const declaracion = await chatbotModel.getStatementByPeriod({
          empresaId: input.id_empresa,
          mes: input.mes,
          year: input.year,
        });
        return (
          declaracion ?? {
            error: `La empresa no tiene declaración jurada cargada para el período ${input.mes}/${input.year}.`,
          }
        );
      }
      return { error: "Indicá id_declaracion, o bien id_empresa + mes + year." };
    }

    case "empleados_declaracion": {
      const empleados = await chatbotModel.statementEmployees({
        declaracionId: input.id_declaracion,
        limit: input.limite ?? 200,
      });
      return { cantidad: empleados.length, empleados };
    }

    case "deuda_empresa": {
      const empresa = await chatbotModel.getCompany(input.id_empresa);
      if (!empresa) return { error: "No existe una empresa con ese id." };
      const [deuda, periodos] = await Promise.all([
        chatbotModel.companyDebt(input.id_empresa),
        chatbotModel.missingPeriods(input.id_empresa),
      ]);
      return {
        empresa: { id: empresa.id, nombre: empresa.nombre, cuit: empresa.cuit, estado: empresa.estado },
        ...deuda,
        periodos_sin_declarar_vencidos: periodos.faltantes.filter((p) => p.vencido),
        periodos_sin_declarar_en_termino: periodos.faltantes.filter((p) => !p.vencido),
        nota:
          "El interés es una estimación al día de hoy con la fórmula del Panel de Pagos; el monto definitivo lo fija el panel al cargar la fecha real de pago. Los períodos sin declarar no tienen importe porque no hay declaración.",
      };
    }

    case "buscar_empleado": {
      const empleados = await chatbotModel.searchEmployees({
        texto: input.texto ?? "",
        limit: input.limite ?? 15,
      });
      return { cantidad: empleados.length, empleados };
    }

    case "listar_empleados_empresa": {
      const { total, empleados } = await chatbotModel.listCompanyEmployees({
        empresaId: input.id_empresa,
        soloActivos: input.solo_activos !== false,
        limit: input.limite ?? 100,
      });
      return { total, cantidad: empleados.length, listados: empleados.length, empleados };
    }

    case "empresas_deudoras": {
      const empresas = await chatbotModel.debtorCompanies({
        limit: input.limite ?? 20,
        incluirInactivas: input.incluir_inactivas === true,
      });
      return {
        cantidad: empresas.length,
        empresas,
        nota: "saldo_sin_interes no incluye la mora. Para el monto actualizado de una empresa usá deuda_empresa.",
      };
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
      const filas = quitarColumnasSensibles(await chatbotModel.runReadOnlyQuery(sql));
      return {
        sql_ejecutado: sql,
        cantidad: filas.length,
        ...(filas.length >= LIMITE_FILAS
          ? { aviso: `El resultado se cortó en ${LIMITE_FILAS} filas: si necesitás totales, agregá en SQL.` }
          : {}),
        filas,
      };
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
