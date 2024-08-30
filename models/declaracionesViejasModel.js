import { pool } from "../db/db.js";

const declaracionesViejasModel = {
  getAll: async () => {
    const query = `
      SELECT dj.*, e.nombre AS nombre_empresa, e.cuit AS cuit_empresa
      FROM old_declaraciones_juradas dj
      INNER JOIN old_empresas e ON dj.old_empresa_id = e.id
      ORDER BY dj.fecha DESC
    `;

    const [results] = await pool.query(query);
    return results;
  },

  getOne: async (id) => {
    const query = `
    SELECT * FROM old_declaraciones_juradas WHERE id = ?
    `;
    const [result] = await pool.query(query, id);
    return result[0];
  },
};

export default declaracionesViejasModel;
