import express from "express";
import cors from "cors";
import noticiasRouter from "./routes/noticias.js";
import dashboardRouter from "./routes/dashboard.js";
import { pool } from "./db/db.js";
import http from "http";

import loginRouter from "./routes/login.js";
import empresasRouter from "./routes/empresas.js";
import usuariosAdminController from "./routes/adminInfo.js";
import escalasRouter from "./routes/escalas.js";

const app = express();
const startingPort = 3006;

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));

// Middleware para parsear el body de las peticiones
app.use(express.json());

// Middleware para pasar el pool de conexiones a las rutas
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Usa el router para manejar las rutas /noticias

app.use("/login", loginRouter);

app.use("/dashboard", dashboardRouter);

app.use("/empresas", empresasRouter);

app.use("/noticias", noticiasRouter);
app.use("/administradores", usuariosAdminController);

app.use("/escalas", escalasRouter);

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
