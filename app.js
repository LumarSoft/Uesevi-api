import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { pool } from "./db/db.js"; // Base de datos
import "./cronJobs.js"; // Tareas programadas
import { authRequired } from "./middlewares/auth.js";
import { logRequestError, logError, ERROR_LOG_PATH } from "./utils/logger.js";

// Rutas
import loginRouter from "./routes/loginRoute.js";
import dashboardRouter from "./routes/dashboardRoute.js";
import companiesRouter from "./routes/companiesRoute.js";
import employeeRouter from "./routes/employeesRoute.js";
import adminRouter from "./routes/adminRoute.js";
import scaleRouter from "./routes/scaleRoute.js";
import formRouter from "./routes/formRoute.js";
import ratesRouter from "./routes/ratesRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import oldStatementsRouter from "./routes/oldStatementsRoute.js";
import statementsRouter from "./routes/statementsRoute.js";
import contractsRouter from "./routes/contractsRoute.js";
import oldContractsRouter from "./routes/oldContratsRoute.js";
import oldCompaniesRouter from "./routes/oldCompaniesRoute.js";
import inquiriesRouter from "./routes/inquiriesRoute.js";
import newsRouter from "./routes/newsRoute.js";
import basicSalaryRouter from "./routes/basicSalaryRoute.js";
import paymentsPanelRouter from "./routes/paymentsPanelRoute.js";
import chatbotRouter from "./routes/chatbotRoute.js";
import facturacionRouter from "./routes/facturacionRoute.js";

const app = express();
const startingPort = process.env.PORT || 3010; // Usar variable de entorno para el puerto

// Resuelve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Orígenes permitidos (front de producción y desarrollo local)
const allowedOrigins = [
  "https://uesevi.org.ar",
  "http://localhost:3000",
  "http://localhost:3001", // Next.js cae en 3001 cuando el 3000 está ocupado
];

// En producción el detalle técnico de un error (mensaje de MySQL, stack, ruta de
// archivo) no debe llegar al navegador: queda solo en el log del servidor.
// El front usa `message` y `errors`; el campo `error` es únicamente de depuración.
const sanitizeErrorBody = (body, statusCode) => {
  if (process.env.NODE_ENV !== "production") return body;
  if (typeof body !== "string") return body;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return body; // No es JSON (HTML, texto plano): se deja como está.
  }
  if (!parsed || typeof parsed !== "object" || !("error" in parsed)) return body;

  parsed.error = null;
  // Un 5xx puede traer el mensaje crudo de la base en `message`; se reemplaza.
  if (statusCode >= 500) parsed.message = "Error interno del servidor";
  return JSON.stringify(parsed);
};

// Middleware
const setupMiddleware = () => {
  app.use(
    helmet({
      // Las imágenes de /uploads se sirven a un origen distinto (el front).
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
      ],
      exposedHeaders: ["Content-Length", "Content-Type"],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 3600
    })
  );

  app.use((req, res, next) => {
    const startTime = Date.now();
    const url = req.originalUrl;
    const method = req.method;
    
    console.log(`🔹 Petición recibida: ${method} ${url}`);
    
    const originalSend = res.send;
    res.send = function(body) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (res.statusCode >= 400) {
        // Registra todo error respondido por cualquier controlador (res.status(4xx/5xx).json(...))
        // Se loguea el cuerpo completo ANTES de sanearlo, así el detalle queda en el servidor.
        logRequestError({ req, statusCode: res.statusCode, body, error: res.locals.error });
        body = sanitizeErrorBody(body, res.statusCode);
      } else {
        console.log(`✅ Respuesta enviada: ${method} ${url} - Status: ${res.statusCode} - Tiempo: ${duration}ms`);
      }
      
      return originalSend.call(this, body);
    };
    
    res.on('close', () => {
      if (!res.writableEnded) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`❌ Conexión cerrada sin respuesta: ${method} ${url} - Tiempo: ${duration}ms`);
      }
    });
    
    next();
  });

  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "5mb", extended: true }));

  // Middleware para pasar el pool de conexiones a las rutas
  app.use((req, res, next) => {
    req.pool = pool;
    next();
  });
};

// Rate limit fuerte en /login (anti fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    status: "error",
    statusCode: 429,
    message: "Demasiados intentos, intentá de nuevo más tarde",
  },
});

// Configuración de rutas
const setupRoutes = () => {
  // ---- 1. Rutas públicas (sin token) ----
  app.get("/health", (req, res) => res.status(200).send("OK"));
  app.use("/login", loginLimiter, loginRouter);
  app.use("/news", newsRouter); // lecturas públicas; escrituras protegidas dentro del router
  app.use("/inquiries", inquiriesRouter); // POST público; el GET se protege dentro del router
  app.use("/forms", formRouter); // GET /complete/:cuil y POST / son públicos; resto protegido dentro del router

  // Consumo del asistente para la facturación del proveedor: no lo mira un
  // usuario del panel sino la web de Lumarsoft, con su propio token de header.
  app.use("/facturacion", facturacionRouter);

  // ---- 2. Barrera: a partir de acá, todo exige token ----
  app.use(authRequired);

  // ---- 3. Rutas protegidas ----
  app.use("/dashboard", dashboardRouter);
  app.use("/companies", companiesRouter);
  app.use("/employees", employeeRouter);
  app.use("/administrators", adminRouter);
  app.use("/scales", scaleRouter);
  app.use("/rates", ratesRouter);
  app.use("/category", categoryRouter);
  app.use("/old-statements", oldStatementsRouter);
  app.use("/statements", statementsRouter);
  app.use("/contracts", contractsRouter);
  app.use("/old-contracts", oldContractsRouter);
  app.use("/old-companies", oldCompaniesRouter);
  app.use("/basicSalary", basicSalaryRouter);
  app.use("/payments-panel", paymentsPanelRouter);
  app.use("/chatbot", chatbotRouter);

  // ---- 4. Manejador central de errores (next(err) o excepciones en handlers sync) ----
  app.use((err, req, res, next) => {
    res.locals.error = err;
    const statusCode = err.statusCode || err.status || 500;
    if (res.headersSent) return next(err);
    res.status(statusCode).json({
      ok: false,
      status: "error",
      statusCode,
      message: statusCode >= 500 ? "Error interno del servidor" : err.message,
      error: process.env.NODE_ENV === "production" ? null : err.message,
    });
  });
};

// Función para encontrar un puerto disponible
const findAvailablePort = (port) => {
  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    server.close(() => {
      app.listen(port, () => {
        console.log(
          `Servidor realmente escuchando en http://localhost:${port}`
        );
      });
    });
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(
        `Puerto ${port} en uso, intentando con el puerto ${port + 1}`
      );
      findAvailablePort(port + 1);
    } else {
      console.error("Error al intentar usar el puerto:", err);
    }
  });
};

process.on("uncaughtException", (error) => {
  logError("uncaughtException", error);
});

process.on("unhandledRejection", (reason) => {
  logError("unhandledRejection", reason);
});

// Verifica la conexión a la base al arrancar: el error más común en local es de credenciales/puerto.
pool
  .query("SELECT 1")
  .then(() => console.log("🗄️  Conexión a MySQL OK"))
  .catch((err) =>
    logError("db-connect", err, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      database: process.env.DB_DATABASE,
    })
  );

console.log(`📝 Errores registrados en ${ERROR_LOG_PATH}`);

// Inicialización
setupMiddleware();
setupRoutes();
findAvailablePort(startingPort);
