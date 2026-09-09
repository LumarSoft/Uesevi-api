import express from "express";
import path from "path";
import multer from "multer";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import chatbotController from "../controllers/chatbotController.js";
import upload from "../multerconfig.js";
import {
  EXTENSIONES_PERMITIDAS,
  TAMANO_MAXIMO_BYTES,
} from "../utils/chatbotExcel.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

// El Excel que manda el admin se analiza en memoria y se descarta: NO usa el
// `upload` de multerconfig, que escribe en uploads/ y esa carpeta se sirve
// estática en /uploads. Un padrón con CUILs no puede quedar público.
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      return cb(
        new Error(
          `Formato no soportado (${extension || "sin extensión"}). Adjuntá un archivo ${EXTENSIONES_PERMITIDAS.join(", ")}.`
        )
      );
    }
    cb(null, true);
  },
});

// Multer tira el error fuera del flujo normal de express: lo traducimos al
// mismo envelope que usa el resto de la API.
const manejarErrorDeArchivo = (error, req, res, next) => {
  if (!error) return next();
  const excedido = error.code === "LIMIT_FILE_SIZE";
  return res.status(400).json({
    ok: false,
    status: "error",
    statusCode: 400,
    message: excedido
      ? `El archivo supera el máximo de ${Math.round(TAMANO_MAXIMO_BYTES / 1024 / 1024)} MB`
      : error.message || "No se pudo procesar el archivo adjunto",
    error: error.message || null,
  });
};

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

router.post(
  "/",
  requireRole("admin"),
  chatbotLimiter,
  uploadExcel.single("archivo"),
  manejarErrorDeArchivo,
  chatbotController.ask
); // POST /chatbot

router.get("/uso", requireRole("admin"), chatbotController.uso); // GET /chatbot/uso

router.get("/reporte", requireRole("admin"), chatbotController.reporte); // GET /chatbot/reporte

router.put("/plan", requireRole("admin"), upload.none(), chatbotController.actualizarPlan); // PUT /chatbot/plan

router.post("/confirm", requireRole("admin"), upload.none(), chatbotController.confirm); // POST /chatbot/confirm

router.post("/discard", requireRole("admin"), upload.none(), chatbotController.discard); // POST /chatbot/discard

export default router;
