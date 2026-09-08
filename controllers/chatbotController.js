import OpenAI from "openai";
import { analizarExcelDeclaracion } from "../utils/chatbotExcel.js";
import {
  definicionesHerramientas,
  ejecutarHerramienta,
  obtenerPropuesta,
  descartarPropuesta,
  ejecutarPropuesta,
} from "../utils/chatbotTools.js";

// Función de manejo de errores
const handleError = (
  res,
  error,
  statusCode = 500,
  defaultMessage = "Error interno del servidor"
) => {
  console.error("Error en el controlador:", error);
  res.status(statusCode).json({
    ok: false,
    status: "error",
    statusCode,
    message: defaultMessage,
    error: error?.message || null,
  });
};

// Función de respuesta estándar
const response = (res, data, statusCode = 200, message = "Éxito") => {
  res.status(statusCode).json({
    ok: true,
    status: "success",
    statusCode,
    message,
    data,
  });
};

const MODELO = process.env.OPENAI_MODEL || "gpt-5.6-luna";
const MAX_ITERACIONES = 8; // tope de vueltas del loop de herramientas
const MAX_ITEMS_HISTORIAL = 60;

let cliente = null;
const getCliente = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!cliente) cliente = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return cliente;
};

// Las instrucciones son fijas a propósito: OpenAI cachea el prefijo del prompt.
const INSTRUCCIONES = `Sos el asistente interno del panel de administración de UESEVI (sindicato y obra social de Rosario). Trabajás para el personal del sindicato y respondés consultas sobre la base de datos del sistema.

Hablás en español rioplatense, de manera breve y concreta. Nada de rodeos ni disclaimers innecesarios.

## Cómo trabajás

- Respondé SIEMPRE con datos obtenidos de las herramientas. Nunca inventes nombres, CUIT, montos, emails ni fechas: si una herramienta no devuelve el dato, decí que no lo encontraste.
- Casi toda consulta sobre una empresa o un empleado arranca buscándolo para obtener su id. Si la búsqueda devuelve varias coincidencias, listalas y preguntá a cuál se refiere en lugar de elegir una.
- Cuando ninguna herramienta específica alcanza (rankings, totales, cruces raros), usá "consulta_sql" con un SELECT de solo lectura.
- Presentá los resultados en listas o tablas markdown cortas cuando sean varios registros. Los montos en pesos, los períodos como "mes/año" (por ejemplo 8/2026).

## Dominio (leelo antes de escribir SQL)

- Una **declaración jurada** (tabla declaraciones_juradas) es la presentación mensual de la nómina de una empresa: una fila por empresa_id + mes + year + rectificada.
- **Las rectificaciones no actualizan la fila**: se marca la vieja con estado = 3 y se inserta una nueva con rectificada + 1. Por eso un período puede tener varias filas y sólo vale la de mayor "rectificada". En SQL siempre filtrá con el INNER JOIN de MAX(rectificada) agrupado por empresa_id, mes y year.
- estado de la declaración: 0 = pendiente de pago, 1 = pagada/aprobada, 2 = pago parcial, 3 = reemplazada por una rectificación.
- vencimiento = último día del mes siguiente al período. importe = subtotal + interes.
- **empresas**: cuit, nombre, email_contacto (el que usa el mailer), telefono, domicilio, ciudad, estado ('Activo' o 'Pendiente'; una empresa recién registrada queda 'Pendiente' hasta que un admin la aprueba).
- **empleados**: se identifican por cuil; el nombre y el email están en la tabla usuarios (empleados.usuario_id). sindicato_activo = 1 significa afiliado.
- **contratos** vincula empleado con empresa. El contrato vigente es el que tiene deleted IS NULL y estado = '1'. Para saber en qué empresa está una persona, mirá su contrato vigente.
- **sueldos** guarda una fila por empleado declarado en cada declaración jurada (columna declaraciones_jurada_id, así, en singular). Es una foto congelada: monto es el sueldo declarado y sueldo_basico es el básico de la categoría al momento de la carga. Nunca se recalcula.
- **auxiliar** guarda el desglose congelado de cada declaración: fas, solidario, sindical, total.
- Aportes por empleado: FAS 1% del básico de la categoría 1 (para todos), aporte sindical 3% del sueldo declarado más adicionales (sólo afiliados), aporte solidario 2% de (básico + presentismo) de la categoría (sólo no afiliados).
- **categorias** es la escala salarial. La categoría id 1 es la general y su sueldo_basico es la base del FAS.
- **tasa** tiene una sola fila: porcentaje es la tasa DIARIA de mora.

## Revisión de archivos Excel

A veces el administrador adjunta el Excel de una declaración jurada que una empresa no pudo subir. En ese caso vas a recibir, junto al mensaje, un bloque ANALISIS_DEL_ARCHIVO con el resultado de pasar ese archivo por la MISMA validación que corre la importación real. No es una opinión tuya: es lo que la empresa va a ver si intenta subirlo.

Cuando aparezca ese bloque:
- Si "es_valido" es true, decí que el archivo pasa la validación y que el problema de la empresa está en otro lado (sesión vencida, período ya declarado, mes anterior sin declarar, o que subió otro archivo).
- Si hay errores, explicá el problema agrupado por tipo, no fila por fila: primero cuántas filas afecta y qué hay que corregir, después el detalle de las filas concretas (usá el número de fila del Excel que viene en "fila"). Si "errores_omitidos" es mayor que cero, aclarale que hay más casos del mismo tipo.
- Si faltan columnas obligatorias, ese es el problema principal: el archivo no tiene el formato de la plantilla y hay que decírselo primero. Nombrá las columnas que faltan usando los títulos de "columnas_obligatorias_faltantes", que son los de la plantilla. NUNCA le muestres al usuario las claves internas de "columnas_detectadas" (vienen sin acentos ni espacios, como "categora" o "sueldo_bsico"): son un detalle técnico y confunden.
- Si una categoría no existe, mostrale las válidas que vienen en "categorias_validas_del_sistema".
- Cerrá siempre con qué tiene que corregir la empresa, en una lista corta y accionable.
- No inventes errores que no estén en el bloque, y no uses las herramientas de base de datos para "revisar" el archivo: el análisis ya está hecho.

## Modificaciones

Podés proponer cambios con las herramientas "proponer_*", pero vos no ejecutás nada: queda una propuesta que el administrador confirma con un botón en el panel. Cuando registres una propuesta, contale al usuario en una o dos líneas qué valor se cambia, de cuánto a cuánto, y que tiene que confirmarla. No inventes que el cambio ya se aplicó.

Si te piden modificar algo para lo que no tenés herramienta (cargar o rectificar una declaración, borrar registros, crear empresas o usuarios), decí que eso se hace desde la pantalla correspondiente del panel y no por acá.`;

/**
 * Recorta el historial sin romper pares function_call / function_call_output.
 * Corta siempre en un mensaje del usuario: si se corta en el medio de una
 * ronda de herramientas, la API rechaza el request por un output huérfano.
 */
const recortarHistorial = (items) => {
  if (items.length <= MAX_ITEMS_HISTORIAL) return items;
  const sobrante = items.length - MAX_ITEMS_HISTORIAL;
  for (let i = sobrante; i < items.length; i += 1) {
    if (items[i]?.role === "user") return items.slice(i);
  }
  return items;
};

// Normaliza el historial que manda el front: puede venir como string (FormData).
const parsearConversacion = (valor) => {
  if (!valor) return [];
  let conversacion = valor;
  if (typeof conversacion === "string") {
    try {
      conversacion = JSON.parse(conversacion);
    } catch (_) {
      return [];
    }
  }
  if (!Array.isArray(conversacion)) return [];
  return recortarHistorial(conversacion);
};

const chatbotController = {
  // POST /chatbot
  ask: async (req, res) => {
    try {
      const openai = getCliente();
      if (!openai) {
        return handleError(
          res,
          null,
          503,
          "El chatbot no está configurado: falta OPENAI_API_KEY en el servidor."
        );
      }

      const textoPlano = typeof req.body.mensaje === "string" ? req.body.mensaje.trim() : "";
      // Adjuntar el Excel sin escribir nada es un caso normal: se asume que lo
      // que quiere es que lo revisemos.
      const mensaje =
        textoPlano || (req.file ? "Revisá este Excel de declaración jurada." : "");
      if (!mensaje) {
        return handleError(res, null, 400, "Falta el mensaje de la consulta");
      }

      const input = parsearConversacion(req.body.conversacion);

      // Si vino un Excel adjunto lo analizamos ANTES de llamar al modelo y le
      // pasamos el informe como contexto del turno. El archivo no se guarda en
      // ningún lado: vive en memoria durante este request.
      let analisisArchivo = null;
      if (req.file) {
        try {
          analisisArchivo = await analizarExcelDeclaracion(req.file);
        } catch (error) {
          console.error("Error analizando el Excel adjunto:", error);
          analisisArchivo = {
            archivo: req.file.originalname,
            legible: false,
            error: `No se pudo analizar el archivo: ${error.message}`,
          };
        }
      }

      const contenidoUsuario = analisisArchivo
        ? `${mensaje}\n\n<ANALISIS_DEL_ARCHIVO>\n${JSON.stringify(analisisArchivo, null, 1)}\n</ANALISIS_DEL_ARCHIVO>`
        : mensaje;

      input.push({ role: "user", content: contenidoUsuario });

      const contexto = { usuarioId: req.user.id };
      const herramientasUsadas = [];
      const propuestas = [];
      let respuestaTexto = "";
      let quedaronLlamadas = false;

      for (let vuelta = 0; vuelta < MAX_ITERACIONES; vuelta += 1) {
        const respuestaModelo = await openai.responses.create({
          model: MODELO,
          instructions: INSTRUCCIONES,
          input,
          tools: definicionesHerramientas,
          reasoning: { effort: "medium" },
          // No dejamos la conversación guardada del lado de OpenAI: el
          // historial viaja en cada request y lo administra el front.
          store: false,
        });

        // Hay que reenviar TODOS los items devueltos (incluidos los de
        // razonamiento), si no la próxima vuelta falla por referencias rotas.
        input.push(...respuestaModelo.output);

        const llamadas = respuestaModelo.output.filter((item) => item.type === "function_call");
        respuestaTexto = (respuestaModelo.output_text || "").trim();

        if (!llamadas.length) {
          quedaronLlamadas = false;
          break;
        }
        quedaronLlamadas = true;

        for (const llamada of llamadas) {
          let argumentos = {};
          try {
            argumentos = JSON.parse(llamada.arguments || "{}");
          } catch (_) {
            argumentos = {};
          }

          let resultado;
          try {
            resultado = await ejecutarHerramienta(llamada.name, argumentos, contexto);
          } catch (error) {
            console.error(`Error ejecutando la herramienta ${llamada.name}:`, error);
            resultado = { error: `Falló la consulta a la base: ${error.message}` };
          }

          herramientasUsadas.push({ nombre: llamada.name, input: argumentos });
          if (resultado?.propuesta_registrada) {
            propuestas.push({
              id: resultado.id_propuesta,
              resumen: resultado.resumen,
              valores_actuales: resultado.valores_actuales,
              valores_nuevos: resultado.valores_nuevos,
            });
          }

          input.push({
            type: "function_call_output",
            call_id: llamada.call_id,
            output: JSON.stringify(resultado),
          });
        }
      }

      if (quedaronLlamadas) {
        respuestaTexto =
          respuestaTexto ||
          "La consulta necesitó demasiados pasos y la corté. Probá preguntándome algo más acotado.";
      }
      if (!respuestaTexto) {
        respuestaTexto = "No pude armar una respuesta para esa consulta.";
      }

      response(
        res,
        {
          respuesta: respuestaTexto,
          analisis_archivo: analisisArchivo
            ? {
                archivo: analisisArchivo.archivo,
                legible: analisisArchivo.legible,
                es_valido: analisisArchivo.es_valido ?? false,
                filas_leidas: analisisArchivo.filas_leidas ?? 0,
                cantidad_errores: analisisArchivo.cantidad_errores ?? 0,
              }
            : null,
          propuestas,
          herramientas_usadas: herramientasUsadas,
          conversacion: recortarHistorial(input),
        },
        200,
        "Consulta procesada con éxito"
      );
    } catch (error) {
      if (error instanceof OpenAI.AuthenticationError) {
        return handleError(res, error, 502, "La API key del chatbot es inválida");
      }
      if (error instanceof OpenAI.RateLimitError) {
        return handleError(res, error, 429, "El chatbot está saturado, probá de nuevo en un momento");
      }
      if (error instanceof OpenAI.APIError) {
        return handleError(res, error, 502, "Error comunicándose con el modelo");
      }
      handleError(res, error, 500, "Error procesando la consulta del chatbot");
    }
  },

  // POST /chatbot/confirm — ejecuta una propuesta de escritura ya aprobada
  confirm: async (req, res) => {
    try {
      const { id_propuesta } = req.body;
      if (!id_propuesta) {
        return handleError(res, null, 400, "Falta el id de la propuesta");
      }

      const propuesta = obtenerPropuesta(id_propuesta, req.user.id);
      if (!propuesta) {
        return handleError(
          res,
          null,
          404,
          "La propuesta no existe, ya se aplicó o venció. Pedile al chatbot que la genere de nuevo."
        );
      }

      const filasAfectadas = await ejecutarPropuesta(propuesta);
      // Un solo uso: se descarta aunque no haya afectado filas.
      descartarPropuesta(propuesta.id);

      if (!filasAfectadas) {
        return handleError(res, null, 404, "No se encontró el registro a modificar");
      }

      console.log(
        `🤖 Chatbot: el usuario ${req.user.id} aplicó "${propuesta.resumen}"`,
        propuesta.cambios
      );

      response(
        res,
        {
          id_propuesta: propuesta.id,
          resumen: propuesta.resumen,
          cambios: propuesta.cambios,
          filas_afectadas: filasAfectadas,
        },
        200,
        "Cambio aplicado con éxito"
      );
    } catch (error) {
      handleError(res, error, 500, "Error aplicando el cambio");
    }
  },

  // POST /chatbot/discard — descarta una propuesta sin aplicarla
  discard: async (req, res) => {
    try {
      const { id_propuesta } = req.body;
      if (!id_propuesta) {
        return handleError(res, null, 400, "Falta el id de la propuesta");
      }

      const propuesta = obtenerPropuesta(id_propuesta, req.user.id);
      if (!propuesta) {
        return handleError(res, null, 404, "La propuesta no existe o ya venció");
      }
      descartarPropuesta(propuesta.id);
      response(res, { id_propuesta: propuesta.id }, 200, "Propuesta descartada");
    } catch (error) {
      handleError(res, error, 500, "Error descartando la propuesta");
    }
  },
};

export default chatbotController;
