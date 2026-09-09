import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Logger mínimo sin dependencias: escribe en consola y en logs/error.log (una línea JSON por evento).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "logs");
const ERROR_LOG = path.join(LOG_DIR, "error.log");

const ensureDir = () => {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
};

const serializeError = (err) => {
  if (!err) return null;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      code: err.code, // p. ej. ER_ACCESS_DENIED_ERROR, ECONNREFUSED
      sqlMessage: err.sqlMessage,
      sql: err.sql,
      stack: err.stack,
    };
  }
  return err;
};

const write = (level, entry) => {
  const record = { ts: new Date().toISOString(), level, ...entry };
  try {
    ensureDir();
    fs.appendFileSync(ERROR_LOG, JSON.stringify(record) + "\n");
  } catch (e) {
    console.error("No se pudo escribir en el log:", e.message);
  }
  return record;
};

/** Error de una request HTTP (ya sea lanzado o respondido con status >= 400). */
export const logRequestError = ({ req, statusCode, body, error }) => {
  const record = write("error", {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    ip: req.ip,
    user: req.user ? { id: req.user.id, rol: req.user.rol } : undefined,
    body: sanitizeBody(req.body),
    response: typeof body === "string" ? safeParse(body) : body,
    error: serializeError(error),
  });

  const detail = record.error?.message || record.response?.error || record.response?.message || "";
  console.error(`❌ ${req.method} ${req.originalUrl} -> ${statusCode} | ${detail}`);
  if (record.error?.stack && statusCode >= 500) console.error(record.error.stack);
};

/** Errores fuera del ciclo de una request (cron, uncaughtException, etc.). */
export const logError = (context, error, extra = {}) => {
  const record = write("error", { context, error: serializeError(error), ...extra });
  console.error(`❌ [${context}]`, record.error?.message || record.error, extra);
};

// Substring: cubre "password", "newPassword", "userToken", etc.
const SENSITIVE_PARTS = [
  "password",
  "contraseña",
  "contrasenia",
  "clave",
  "token",
  "authorization",
];
// Exacto: "code" como substring afectaría a "statusCode", "codigoPostal", etc.
const SENSITIVE_EXACT = ["code", "codigo", "resetcode"];

const isSensitiveKey = (key) => {
  const k = key.toLowerCase();
  return SENSITIVE_PARTS.some((s) => k.includes(s)) || SENSITIVE_EXACT.includes(k);
};

const sanitizeBody = (body) => {
  if (!body || typeof body !== "object") return body;
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    out[k] = isSensitiveKey(k) ? "[oculto]" : v;
  }
  return out;
};

const safeParse = (s) => {
  try { return JSON.parse(s); } catch { return s?.slice?.(0, 500) ?? s; }
};

export const ERROR_LOG_PATH = ERROR_LOG;
