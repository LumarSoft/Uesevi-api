import { pool } from "../db/db.js";

const declaracionesModel = {
  getAll: async () => {
    const query = `
      SELECT dj.*, e.nombre AS nombre_empresa, e.cuit AS cuit_empresa
      FROM declaraciones_juradas dj
      INNER JOIN empresas e ON dj.empresa_id = e.id ORDER BY dj.modified DESC
    `;
    const [results] = await pool.query(query);
    return results;
  },

  changeState: async (id, state) => {
    const query = `
      UPDATE declaraciones_juradas
      SET estado = ?
      WHERE id = ?
    `;
    const result = await pool.query(query, [state, id]);
    return result;
  },
};

export default declaracionesModel;
