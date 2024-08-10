import cron from "node-cron";
import { pool } from "./db/db.js";

const checkAndUpdateSalaries = async () => {
  const now = new Date();
  const query =
    "UPDATE categorias SET sueldo_basico = sueldo_futuro, sueldo_futuro = NULL, fecha_vigencia = NULL WHERE fecha_vigencia <= ? AND sueldo_futuro IS NOT NULL";

  await pool.query(query, [now]);
};

// Ejecutar el job cada día a la medianoche
cron.schedule("0 0 * * *", checkAndUpdateSalaries);
