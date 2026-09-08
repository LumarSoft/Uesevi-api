import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import chatbotController from "../controllers/chatbotController.js";
import upload from "../multerconfig.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Cada consulta cuesta plata (llama al modelo): acotamos por admin.
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // La ruta ya pasó por authRequired, así que normalmente hay usuario. El
  // fallback por IP tiene que pasar por ipKeyGenerator: normaliza los IPv6 a
  // su prefijo /64, si no cada dirección de un mismo cliente cuenta aparte.
  keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
  message: {
    ok: false,
    status: "error",
    statusCode: 429,
    message: "Demasiadas consultas seguidas, esperá un momento",
  },
});

router.post("/", requireRole("admin"), chatbotLimiter, upload.none(), chatbotController.ask); // POST /chatbot

router.post("/confirm", requireRole("admin"), upload.none(), chatbotController.confirm); // POST /chatbot/confirm

router.post("/discard", requireRole("admin"), upload.none(), chatbotController.discard); // POST /chatbot/discard

export default router;
