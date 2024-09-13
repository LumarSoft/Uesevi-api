import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const companiesModel = {
  getAll: async () => {
    const query = `SELECT em.*, us.nombre as nombre_usuario, us.apellido, us.telefono as telefono_usuario FROM empresas em INNER JOIN usuarios us ON us.id = em.usuario_id`;
    const [results] = await pool.query(query);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
    }));

    return formattedResults;
  },

  changeState: async (id, state) => {
    try {
      const query = `UPDATE empresas SET estado = ? WHERE id = ?`;
      const [results] = await pool.query(query, [state, id]);
      return results;
    } catch (e) {
      console.error(e);
    }
  },

  delete: async (id) => {
    try {
      const query = `DELETE FROM empresas WHERE id = ?`;
      const [results] = await pool.query(query, [id]);
      return results;
    } catch (e) {
      console.error(e);
    }
  },
};

export default companiesModel;
