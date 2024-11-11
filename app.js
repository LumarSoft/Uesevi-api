import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import cors from 'cors';


import { pool } from "./db/db.js"; // Base de datos
import "./cronJobs.js"; // Tareas programadas

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

const app = express();
const startingPort = process.env.PORT || 3010; // Usar variable de entorno para el puerto

// Resuelve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
const setupMiddleware = () => {
  app.use(cors({
    origin: '*', // Puedes ajustar el origen según tus necesidades
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
  }));
  

  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use(express.json({ limit: "10mb" })); // Ajusta el tamaño según tus necesidades
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  

  // Middleware para pasar el pool de conexiones a las rutas
  app.use((req, res, next) => {
    req.pool = pool;
    next();
  });
};

// Configuración de rutas
const setupRoutes = () => {
  app.use("/login", loginRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/companies", companiesRouter);
  app.use("/employees", employeeRouter);
  app.use("/news", newsRouter);
  app.use("/administrators", adminRouter);
  app.use("/forms", formRouter);
  app.use("/scales", scaleRouter);
  app.use("/rates", ratesRouter);
  app.use("/category", categoryRouter);
  app.use("/old-statements", oldStatementsRouter);
  app.use("/statements", statementsRouter);
  app.use("/contracts", contractsRouter);
  app.use("/old-contracts", oldContractsRouter);
  app.use("/old-companies", oldCompaniesRouter);
  app.use("/inquiries", inquiriesRouter);
  app.use("/basicSalary", basicSalaryRouter);
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
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
  console.error("Uncaught Exception:", error);
  // Aquí puedes agregar lógica para registrar el error en un archivo de log
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Aquí puedes agregar lógica para registrar el error en un archivo de log
});

// Inicialización
setupMiddleware();
setupRoutes();
findAvailablePort(startingPort);
