import "./utils/installSafeConsole.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  logError,
  normalizeRequestPath,
  shouldLogRequest,
} from "./utils/safeLogging.js";

import { pool } from "./db/db.js"; // Base de datos
import "./cronJobs.js"; // Tareas programadas
import { authRequired } from "./middlewares/auth.js";

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

const app = express();
const startingPort = process.env.PORT || 3010; // Usar variable de entorno para el puerto

// Resuelve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Orígenes permitidos (front de producción y desarrollo local)
const allowedOrigins = [
  "https://uesevi.org.ar",
  "http://localhost:3000",
];

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
    const method = req.method;
    const requestPath = normalizeRequestPath(req.path);
    const logRequest = shouldLogRequest(requestPath);
    let finished = false;

    res.once("finish", () => {
      finished = true;
      if (logRequest) {
        console.log(
          `HTTP ${method} ${requestPath} status=${res.statusCode} durationMs=${Date.now() - startTime}`
        );
      }
    });

    res.once("close", () => {
      if (logRequest && !finished) {
        console.warn(
          `HTTP_ABORTED ${method} ${requestPath} durationMs=${Date.now() - startTime}`
        );
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
  app.use("/companies", companiesRouter); // POST / público; administración protegida dentro del router
  app.use("/scales", scaleRouter); // GET /clients público; administración protegida dentro del router

  // ---- 2. Barrera: a partir de acá, todo exige token ----
  app.use(authRequired);

  // ---- 3. Rutas protegidas ----
  app.use("/dashboard", dashboardRouter);
  app.use("/employees", employeeRouter);
  app.use("/administrators", adminRouter);
  app.use("/rates", ratesRouter);
  app.use("/category", categoryRouter);
  app.use("/old-statements", oldStatementsRouter);
  app.use("/statements", statementsRouter);
  app.use("/contracts", contractsRouter);
  app.use("/old-contracts", oldContractsRouter);
  app.use("/old-companies", oldCompaniesRouter);
  app.use("/basicSalary", basicSalaryRouter);
  app.use("/payments-panel", paymentsPanelRouter);
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
      logError("Error al intentar usar el puerto", err);
    }
  });
};

process.on("uncaughtException", (error) => {
  logError("Uncaught Exception", error);
});

process.on("unhandledRejection", (reason) => {
  logError("Unhandled Rejection", reason);
});

// Inicialización
setupMiddleware();
setupRoutes();
findAvailablePort(startingPort);
