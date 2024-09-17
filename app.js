import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import newsRouter from "./routes/newsRoute.js";
import dashboardRouter from "./routes/dashboardRoute.js";
import { pool } from "./db/db.js";
import http from "http";

import loginRouter from "./routes/loginRoute.js";
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

import "./cronJobs.js";

const app = express();
const startingPort = 3006;

// Resuelve __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));

// Middleware para parsear el body de las peticiones
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware para pasar el pool de conexiones a las rutas
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

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

function findAvailablePort(port) {
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
}

findAvailablePort(startingPort);
