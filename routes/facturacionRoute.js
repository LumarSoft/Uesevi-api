import express from "express";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import chatbotController from "../controllers/chatbotController.js";
import { logError } from "../utils/logger.js";

// ---------------------------------------------------------------------------
// Acceso de facturación al consumo del asistente.
//
// El consumo de Nacho en dólares es información del proveedor del sistema, no
// de UESEVI. En vez de mostrarla dentro del panel del sindicato, se expone acá
// para que la web de Lumarsoft la consulte con un token propio: los datos de
// facturación no conviven con los del cliente y no hace falta tener un usuario
// admin cargado en la base de UESEVI.
//
// Se monta ANTES de la barrera de authRequired: la autenticación es el token
// del header, no el JWT de un usuario del sistema.
//
//   GET  /facturacion/uso      → cupo del período con costos
//   GET  /facturacion/reporte  → costos, proyección, márgenes, consumo por día
//   PUT  /facturacion/plan     → cambia modo, cupo incluido y tope mensual
//
// Todas piden el header `x-facturacion-token` con el valor de
// CHATBOT_FACTURACION_TOKEN. Sin esa variable configurada, el router responde
// 404 y es como si no existiera.
// ---------------------------------------------------------------------------

const router = express.Router();

// Comparación en tiempo constante: un `===` filtra el largo del prefijo válido
// a quien mida los tiempos de respuesta.
const tokenValido = (recibido, esperado) => {
  const a = Buffer.from(String(recibido || ""));
  const b = Buffer.from(String(esperado));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

const requiereTokenDeFacturacion = (req, res, next) => {
  const esperado = process.env.CHATBOT_FACTURACION_TOKEN;

  // Sin token configurado la puerta no existe: 404, no 401. No tiene sentido
  // avisarle a nadie que hay un endpoint acá si no se puede usar.
  if (!esperado) {
    return res.status(404).json({
      ok: false,
      status: "error",
      statusCode: 404,
      message: "Recurso no encontrado",
    });
  }

  if (!tokenValido(req.headers["x-facturacion-token"], esperado)) {
    logError("facturacion.token", new Error("Token de facturación inválido"), { ip: req.ip });
    return res.status(401).json({
      ok: false,
      status: "error",
      statusCode: 401,
      message: "No autenticado",
    });
  }

  // El controlador decide qué mostrar según quién pregunta: esta marca lo
  // habilita a devolver los costos sin depender de un usuario del panel.
  req.facturacion = true;
  next();
};

// Es un endpoint de lectura para un tablero propio, no una API pública: con
// esto alcanza y de paso limita el ruido de intentos con token inválido.
const limitador = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    status: "error",
    statusCode: 429,
    message: "Demasiadas consultas seguidas",
  },
});

router.use(limitador, requiereTokenDeFacturacion);

router.get("/uso", chatbotController.uso); // GET /facturacion/uso

router.get("/reporte", chatbotController.reporte); // GET /facturacion/reporte

router.put("/plan", express.json(), chatbotController.actualizarPlan); // PUT /facturacion/plan

export default router;
