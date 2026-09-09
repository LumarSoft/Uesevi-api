import OpenAI from "openai";
import { analizarExcelDeclaracion } from "../utils/chatbotExcel.js";
import {
  definicionesHerramientas,
  ejecutarHerramienta,
  obtenerPropuesta,
  descartarPropuesta,
  ejecutarPropuesta,
  describirHerramienta,
  resumirResultado,
} from "../utils/chatbotTools.js";
import { INSTRUCCIONES, contextoDelDia } from "../utils/chatbotPrompt.js";
import chatbotUsoModel from "../models/chatbotUsoModel.js";
import { nuevaMedicion, sumarUso, calcularCosto, precios, preciosConfigurados } from "../utils/chatbotCostos.js";
import { logError } from "../utils/logger.js";

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
const PING_STREAM_MS = 15000;

// Emails que ven los costos en dólares del asistente: es información del
// proveedor del sistema, no de UESEVI. El personal del sindicato ve su cupo de
// consultas y nada más.
// Emails de admin del panel que además ven los costos. Vacío por defecto: la
// vía normal para mirar el consumo es /facturacion con su token (ver
// routes/facturacionRoute.js), fuera del panel del cliente.
const EMAILS_PROVEEDOR = (process.env.CHATBOT_EMAILS_PROVEEDOR || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// Es proveedor quien entra por /facturacion con el token, o un admin del panel
// cuyo email esté en la lista. La lista normalmente va vacía: los números de
// plata no tienen por qué mostrarse dentro del panel de UESEVI.
const esProveedor = (req) =>
  Boolean(
    req.facturacion ||
      (req.user?.email && EMAILS_PROVEEDOR.includes(String(req.user.email).toLowerCase()))
  );

// Multiplicador sobre el costo del modelo para sugerir un precio de venta. El
// costo de inferencia es sólo una parte de lo que cuesta sostener el módulo
// (soporte, mantenimiento, meses pico, riesgo de tipo de cambio): la referencia
// habitual en la industria va de 4x a 10x.
const MARKUP = Number(process.env.CHATBOT_MARKUP) > 0 ? Number(process.env.CHATBOT_MARKUP) : 5;

// Piso del precio del módulo, en USD por mes. Con este volumen el costo de
// tokens es de centavos: un markup sobre el costo daría un precio absurdo, así
// que el precio sugerido nunca baja del piso. Lo que se cobra es la capacidad
// (horas de trabajo que ahorra), no los tokens.
const PRECIO_PISO_USD =
  Number(process.env.CHATBOT_PRECIO_PISO_USD) > 0 ? Number(process.env.CHATBOT_PRECIO_PISO_USD) : 20;

// Lo que se le muestra al panel: nunca los dólares, salvo que quien pregunta
// sea el proveedor.
const cupoParaUsuario = (cupo, proveedor) => {
  const { costos, ...publico } = cupo;
  return proveedor ? { ...publico, costos } : publico;
};

let cliente = null;
const getCliente = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!cliente) cliente = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return cliente;
};

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
  // Sólo se aceptan items con la forma que devuelve la API: cualquier otra
  // cosa la rechazaría OpenAI con un 400 poco claro.
  return recortarHistorial(conversacion.filter((item) => item && typeof item === "object"));
};

// Texto visible de una respuesta: sólo los mensajes del asistente.
const textoDeSalida = (output = []) =>
  output
    .filter((item) => item.type === "message" && item.role === "assistant")
    .flatMap((item) => item.content ?? [])
    .filter((parte) => parte.type === "output_text")
    .map((parte) => parte.text)
    .join("")
    .trim();

const traducirErrorOpenAI = (error) => {
  if (error instanceof OpenAI.AuthenticationError) {
    return { statusCode: 502, message: "La API key del asistente es inválida" };
  }
  if (error instanceof OpenAI.RateLimitError) {
    return { statusCode: 429, message: "El asistente está saturado, probá de nuevo en un momento" };
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return { statusCode: 504, message: "El asistente tardó demasiado en responder, probá de nuevo" };
  }
  if (error instanceof OpenAI.APIError) {
    return { statusCode: 502, message: "Error comunicándose con el modelo" };
  }
  return { statusCode: 500, message: "Error procesando la consulta del asistente" };
};

/**
 * Canal de eventos hacia el panel (Server-Sent Events). Cada evento es una
 * línea `data: {json}`. Si el cliente no pidió stream, `emitir` no hace nada
 * y la respuesta sale como JSON normal al final.
 */
const abrirStream = (res) => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // nginx: no bufferear
  res.flushHeaders();

  // Comentario periódico para que proxies e intermediarios no corten la
  // conexión mientras el modelo piensa.
  const ping = setInterval(() => {
    if (!res.writableEnded) res.write(": ping\n\n");
  }, PING_STREAM_MS);

  return {
    emitir: (evento) => {
      if (res.writableEnded) return;
      res.write(`data: ${JSON.stringify(evento)}\n\n`);
    },
    cerrar: () => {
      clearInterval(ping);
      if (!res.writableEnded) res.end();
    },
  };
};

/**
 * Loop principal: llama al modelo, ejecuta las herramientas que pide y vuelve
 * a llamarlo hasta que responda con texto. Emite eventos de progreso por
 * `emitir` (no-op cuando no hay stream) y devuelve el resultado final.
 */
const procesarConsulta = async ({ openai, historial, contextoUsuario, emitir, signal, medicion }) => {
  const herramientasUsadas = [];
  const propuestas = [];
  let respuestaTexto = "";
  let quedaronLlamadas = false;
  let vueltas = 0;

  for (let vuelta = 0; vuelta < MAX_ITERACIONES; vuelta += 1) {
    vueltas = vuelta + 1;
    emitir({ tipo: "turno", numero: vueltas });
    emitir({
      tipo: "estado",
      etapa: vuelta === 0 ? "pensando" : "analizando",
      texto: vuelta === 0 ? "Pensando" : "Analizando los resultados",
    });

    // El contexto del día NO se guarda en el historial, y va al FINAL del
    // input: cambia en cada request, así que si fuera adelante invalidaría el
    // caché de prefijo de OpenAI para todo el historial que viene detrás. Al
    // final, el prefijo cacheable abarca instrucciones + herramientas + toda la
    // conversación, y las vueltas del loop se pagan a tarifa de caché.
    const input = [
      ...historial,
      { role: "developer", content: contextoDelDia({ usuario: contextoUsuario }) },
    ];

    const stream = await openai.responses.create(
      {
        model: MODELO,
        instructions: INSTRUCCIONES,
        input,
        tools: definicionesHerramientas,
        reasoning: { effort: "medium" },
        // No dejamos la conversación guardada del lado de OpenAI: el
        // historial viaja en cada request y lo administra el front. Para que
        // eso funcione con razonamiento hay que pedir el contenido cifrado.
        store: false,
        include: ["reasoning.encrypted_content"],
        stream: true,
      },
      { signal }
    );

    let respuestaModelo = null;
    let anuncioTexto = false;
    for await (const evento of stream) {
      switch (evento.type) {
        case "response.output_item.added":
          if (evento.item?.type === "function_call") {
            emitir({ tipo: "estado", etapa: "consultando", texto: "Preparando la consulta" });
          }
          break;
        case "response.output_text.delta":
          if (!anuncioTexto) {
            anuncioTexto = true;
            emitir({ tipo: "estado", etapa: "redactando", texto: "Redactando la respuesta" });
          }
          emitir({ tipo: "texto", delta: evento.delta });
          break;
        case "response.completed":
        case "response.incomplete":
          respuestaModelo = evento.response;
          break;
        case "response.failed":
          throw new Error(evento.response?.error?.message || "El modelo no pudo completar la respuesta");
        case "error":
          throw new Error(evento.message || "Error en el stream del modelo");
        default:
          break;
      }
    }

    if (!respuestaModelo) {
      throw new Error("El modelo cerró la conexión sin terminar la respuesta");
    }

    // Cada vuelta trae su propio consumo de tokens: se acumula acá para poder
    // registrar la consulta completa incluso si más adelante algo falla.
    if (medicion) {
      sumarUso(medicion, respuestaModelo.usage);
      medicion.vueltas = vueltas;
    }

    // Hay que reenviar TODOS los items devueltos (incluidos los de
    // razonamiento), si no la próxima vuelta falla por referencias rotas.
    historial.push(...respuestaModelo.output);

    const llamadas = respuestaModelo.output.filter((item) => item.type === "function_call");
    respuestaTexto = textoDeSalida(respuestaModelo.output);

    if (!llamadas.length) {
      quedaronLlamadas = false;
      break;
    }
    quedaronLlamadas = true;

    // Se anuncian todas las herramientas de la vuelta y después se ejecutan
    // en paralelo: el panel las ve aparecer juntas y completarse a medida.
    const preparadas = llamadas.map((llamada) => {
      let argumentos = {};
      try {
        argumentos = JSON.parse(llamada.arguments || "{}");
      } catch (_) {
        argumentos = {};
      }
      const paso = {
        id: llamada.call_id,
        nombre: llamada.name,
        etiqueta: describirHerramienta(llamada.name, argumentos),
        input: argumentos,
      };
      emitir({ tipo: "herramienta", estado: "inicio", ...paso });
      return { llamada, argumentos, paso };
    });

    await Promise.all(
      preparadas.map(async ({ llamada, argumentos, paso }) => {
        const inicio = Date.now();
        let resultado;
        try {
          resultado = await ejecutarHerramienta(llamada.name, argumentos, {
            usuarioId: contextoUsuario.id,
          });
        } catch (error) {
          logError("chatbot.herramienta", error, { herramienta: llamada.name });
          resultado = { error: `Falló la consulta a la base: ${error.message}` };
        }
        const ms = Date.now() - inicio;
        const conError = Boolean(resultado?.error);
        const resumen = resumirResultado(llamada.name, resultado);

        herramientasUsadas.push({ ...paso, resumen, ms, error: conError ? resultado.error : null });
        if (resultado?.propuesta_registrada) {
          propuestas.push({
            id: resultado.id_propuesta,
            resumen: resultado.resumen,
            valores_actuales: resultado.valores_actuales,
            valores_nuevos: resultado.valores_nuevos,
          });
        }
        emitir({
          tipo: "herramienta",
          estado: "fin",
          id: paso.id,
          nombre: paso.nombre,
          resumen,
          ms,
          error: conError ? resultado.error : null,
        });

        historial.push({
          type: "function_call_output",
          call_id: llamada.call_id,
          output: JSON.stringify(resultado),
        });
      })
    );
  }

  if (quedaronLlamadas) {
    respuestaTexto =
      respuestaTexto ||
      "La consulta necesitó demasiados pasos y la corté. Probá preguntándome algo más acotado.";
  }
  if (!respuestaTexto) {
    respuestaTexto = "No pude armar una respuesta para esa consulta.";
  }

  return { respuestaTexto, herramientasUsadas, propuestas, vueltas };
};

const chatbotController = {
  // POST /chatbot — responde como JSON, o como stream de eventos (SSE) si el
  // cliente manda `Accept: text/event-stream`.
  ask: async (req, res) => {
    const quiereStream = String(req.headers.accept || "").includes("text/event-stream");
    let canal = null;
    const inicio = Date.now();
    const proveedor = esProveedor(req);

    // Se mide siempre, pase lo que pase: una consulta que falla a mitad de
    // camino o que el admin corta igual consumió tokens y hay que contabilizarla.
    const medicion = nuevaMedicion();
    let registrada = false;
    const registrar = async (estado) => {
      if (registrada) return;
      registrada = true;
      await chatbotUsoModel.registrarConsulta({
        usuarioId: req.user?.id,
        modelo: MODELO,
        medicion,
        herramientas: medicion.herramientas || 0,
        duracionMs: Date.now() - inicio,
        conArchivo: Boolean(req.file),
        estado,
      });
    };

    // Si el admin cierra la pestaña o aprieta "Detener", se corta la llamada
    // al modelo: no tiene sentido seguir gastando en una respuesta que nadie
    // va a leer. Se escucha el cierre de `res`, no de `req`: en Node moderno
    // `req` emite "close" apenas termina de leerse el body, no al desconectarse.
    const abortador = new AbortController();
    res.on("close", () => {
      if (!res.writableFinished) abortador.abort();
    });

    try {
      const openai = getCliente();
      if (!openai) {
        return handleError(
          res,
          null,
          503,
          "El asistente no está configurado: falta OPENAI_API_KEY en el servidor."
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

      // Cupo: en modo prueba sólo frena el tope en dólares; con un plan activo
      // frena también al agotarse las consultas incluidas del mes.
      const cupoPrevio = await chatbotUsoModel.estadoDeCupo();
      if (cupoPrevio.bloqueado) {
        const mensajeCupo =
          cupoPrevio.motivo_bloqueo === "tope"
            ? "El asistente alcanzó el tope de consumo del mes y quedó pausado. Escribinos para reactivarlo."
            : `Se agotaron las ${cupoPrevio.consultas_incluidas} consultas incluidas de este mes. Podés ampliar el cupo escribiéndonos.`;
        return res.status(429).json({
          ok: false,
          status: "error",
          statusCode: 429,
          message: mensajeCupo,
          data: { cupo: cupoParaUsuario(cupoPrevio, proveedor) },
        });
      }

      const historial = parsearConversacion(req.body.conversacion);

      if (quiereStream) canal = abrirStream(res);
      const emitir = canal ? canal.emitir : () => {};

      // Si vino un Excel adjunto lo analizamos ANTES de llamar al modelo y le
      // pasamos el informe como contexto del turno. El archivo no se guarda en
      // ningún lado: vive en memoria durante este request.
      let analisisArchivo = null;
      if (req.file) {
        emitir({ tipo: "estado", etapa: "archivo", texto: `Analizando ${req.file.originalname}` });
        try {
          analisisArchivo = await analizarExcelDeclaracion(req.file);
        } catch (error) {
          logError("chatbot.excel", error, { archivo: req.file.originalname });
          analisisArchivo = {
            archivo: req.file.originalname,
            legible: false,
            error: `No se pudo analizar el archivo: ${error.message}`,
          };
        }
        emitir({
          tipo: "archivo",
          archivo: analisisArchivo.archivo,
          legible: analisisArchivo.legible,
          es_valido: analisisArchivo.es_valido ?? false,
          filas_leidas: analisisArchivo.filas_leidas ?? 0,
          cantidad_errores: analisisArchivo.cantidad_errores ?? 0,
        });
      }

      const contenidoUsuario = analisisArchivo
        ? `${mensaje}\n\n<ANALISIS_DEL_ARCHIVO>\n${JSON.stringify(analisisArchivo, null, 1)}\n</ANALISIS_DEL_ARCHIVO>`
        : mensaje;

      historial.push({ role: "user", content: contenidoUsuario });

      const { respuestaTexto, herramientasUsadas, propuestas, vueltas } = await procesarConsulta({
        openai,
        historial,
        contextoUsuario: { id: req.user.id, email: req.user.email },
        emitir,
        signal: abortador.signal,
        medicion,
      });

      medicion.herramientas = herramientasUsadas.length;
      await registrar("ok");
      const cupo = await chatbotUsoModel.estadoDeCupo();

      const data = {
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
        conversacion: recortarHistorial(historial),
        duracion_ms: Date.now() - inicio,
        cupo: cupoParaUsuario(cupo, proveedor),
      };

      // Sin contenido del mensaje: la consulta puede traer datos personales.
      console.log(
        `🤖 Nacho: admin ${req.user.id} · ${vueltas} vuelta(s) · ${herramientasUsadas.length} herramienta(s) · ` +
          `${medicion.tokens_entrada} tok in (${medicion.tokens_cacheados} cacheados) · ` +
          `${medicion.tokens_salida} tok out · ${data.duracion_ms} ms · ` +
          `${cupo.consultas_usadas}/${cupo.consultas_incluidas} del cupo`
      );

      if (canal) {
        canal.emitir({ tipo: "final", data });
        canal.cerrar();
        return;
      }
      response(res, data, 200, "Consulta procesada con éxito");
    } catch (error) {
      // El cliente se fue: no hay a quién responder.
      if (abortador.signal.aborted || error?.name === "AbortError") {
        // Lo que ya consumió antes de cortarse se cobra igual: OpenAI no lo
        // devuelve. La vuelta que quedó a mitad no reporta uso y se pierde.
        await registrar("cancelada");
        if (canal) canal.cerrar();
        console.log(`🤖 Nacho: consulta del admin ${req.user?.id} cancelada por el cliente`);
        return;
      }

      await registrar("error");
      const { statusCode, message } = traducirErrorOpenAI(error);
      logError("chatbot.ask", error, { statusCode });

      if (canal) {
        canal.emitir({ tipo: "error", statusCode, message, detalle: error?.message || null });
        canal.cerrar();
        return;
      }
      handleError(res, error, statusCode, message);
    }
  },

  // GET /chatbot/uso — cupo del período para el panel. Los dólares sólo viajan
  // si quien pregunta es el proveedor del sistema.
  uso: async (req, res) => {
    try {
      const cupo = await chatbotUsoModel.estadoDeCupo();
      response(
        res,
        { ...cupoParaUsuario(cupo, esProveedor(req)), proveedor: esProveedor(req) },
        200,
        "Cupo del período"
      );
    } catch (error) {
      handleError(res, error, 500, "No se pudo leer el consumo del asistente");
    }
  },

  // GET /chatbot/reporte — costos, consumo y márgenes. Sólo para el proveedor.
  reporte: async (req, res) => {
    try {
      if (!esProveedor(req)) {
        return handleError(res, null, 403, "No autorizado para ver el reporte de consumo");
      }

      const periodo = /^\d{4}-\d{2}$/.test(String(req.query.periodo || ""))
        ? String(req.query.periodo)
        : chatbotUsoModel.periodoDe();

      const [plan, totales, porDia, porUsuario, porPeriodo, costoHoy] = await Promise.all([
        chatbotUsoModel.obtenerPlan(),
        chatbotUsoModel.totalesDelPeriodo(periodo),
        chatbotUsoModel.porDia(periodo),
        chatbotUsoModel.porUsuario(periodo),
        chatbotUsoModel.porPeriodo(12),
        chatbotUsoModel.costoRecalculado(periodo),
      ]);

      // El costo guardado en cada fila usa la tarifa que estaba configurada en
      // ese momento; `costoHoy` recalcula sobre los tokens con la tarifa actual.
      // Para decidir precios se usa siempre el recalculado.
      const dias = porDia.length || 0;
      const consultas = totales.consultas;
      const consultasPorDia = dias ? consultas / dias : 0;
      const costoPorDia = dias ? costoHoy / dias : 0;
      const proyeccion30 = costoPorDia * 30;
      const consultas30 = consultasPorDia * 30;

      // Cupo sugerido: el consumo proyectado más 30 % de holgura, redondeado a
      // la cincuentena de arriba. Un cupo que se agota todos los meses genera
      // reclamos; uno demasiado grande no protege de nada.
      const cupoSugerido = Math.max(50, Math.ceil((consultas30 * 1.3) / 50) * 50);

      const precioReferencia = Number(req.query.precio_usd) > 0 ? Number(req.query.precio_usd) : null;
      const redondear = (valor, decimales = 2) => {
        const factor = 10 ** decimales;
        return Math.round((Number(valor) || 0) * factor) / factor;
      };

      const analisis = {
        dias_con_uso: dias,
        consultas,
        consultas_por_dia: redondear(consultasPorDia, 1),
        costo_usd: redondear(costoHoy, 4),
        costo_usd_registrado: redondear(totales.costo_usd, 4),
        costo_promedio_usd: consultas ? redondear(costoHoy / consultas, 4) : 0,
        costo_por_dia_usd: redondear(costoPorDia, 4),
        proyeccion_mensual_usd: redondear(proyeccion30, 2),
        proyeccion_mensual_consultas: Math.round(consultas30),
        cupo_sugerido: cupoSugerido,
        markup: MARKUP,
        piso_usd: PRECIO_PISO_USD,
        precio_sugerido_usd: redondear(Math.max(PRECIO_PISO_USD, proyeccion30 * MARKUP), 2),
        cache_hit: totales.tokens_entrada
          ? redondear((totales.tokens_cacheados / totales.tokens_entrada) * 100, 1)
          : 0,
        precios_configurados: preciosConfigurados(),
        precios: precios(),
      };

      if (precioReferencia) {
        analisis.margen = {
          precio_usd: precioReferencia,
          costo_proyectado_usd: redondear(proyeccion30, 2),
          margen_usd: redondear(precioReferencia - proyeccion30, 2),
          margen_pct: precioReferencia
            ? redondear(((precioReferencia - proyeccion30) / precioReferencia) * 100, 1)
            : 0,
          // Cuántas consultas puede hacer el cliente antes de que el precio se
          // lo coma todo. Si el número es bajo, el precio está mal.
          consultas_equilibrio: analisis.costo_promedio_usd
            ? Math.floor(precioReferencia / analisis.costo_promedio_usd)
            : 0,
        };
      }

      response(
        res,
        { periodo, plan, totales, analisis, por_dia: porDia, por_usuario: porUsuario, por_periodo: porPeriodo },
        200,
        "Reporte de consumo"
      );
    } catch (error) {
      handleError(res, error, 500, "No se pudo armar el reporte de consumo");
    }
  },

  // PUT /chatbot/plan — cambia modo, cupo y tope. Sólo para el proveedor.
  actualizarPlan: async (req, res) => {
    try {
      if (!esProveedor(req)) {
        return handleError(res, null, 403, "No autorizado para cambiar el plan del asistente");
      }
      const plan = await chatbotUsoModel.actualizarPlan(req.body || {});
      console.log(`🤖 Nacho: plan actualizado por ${req.user?.email || "facturación"}`, plan);
      response(res, plan, 200, "Plan actualizado");
    } catch (error) {
      handleError(res, error, 500, "No se pudo actualizar el plan del asistente");
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
          "La propuesta no existe, ya se aplicó o venció. Pedile a Nacho que la genere de nuevo."
        );
      }

      const filasAfectadas = await ejecutarPropuesta(propuesta);
      // Un solo uso: se descarta aunque no haya afectado filas.
      descartarPropuesta(propuesta.id);

      if (!filasAfectadas) {
        return handleError(res, null, 404, "No se encontró el registro a modificar");
      }

      console.log(
        `🤖 Nacho: el admin ${req.user.id} aplicó "${propuesta.resumen}"`,
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
