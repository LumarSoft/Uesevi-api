import express from "express";
import cors from "cors";
import noticiasRouter from "./routes/noticias.js";
import { pool } from "./db/db.js";
import loginRouter from "./routes/login.js";

const app = express();
const port = 3000;

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));

// Middleware para parsear el body de las peticiones
app.use(express.json());

// Middleware para pasar el pool de conexiones a las rutas
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Usa el router para manejar las rutas /noticias
app.use("/noticias", noticiasRouter);
app.use("/login", loginRouter);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
