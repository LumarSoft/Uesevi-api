import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const formModel = {
  getAll: async () => {
    const query = `SELECT * FROM inscripcion`;
    const [results] = await pool.query(query);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  },

  changeCompany: async (empresa, cuil) => {
    try {
      const query = `UPDATE inscripcion SET empresa = ? WHERE cuil = ?`;

      const [results] = await pool.query(query, [empresa, cuil]);

      return results;
    } catch (error) {
      console.error(error);
    }
  },

  getToComplete: async (cuil) => {
    const query = `SELECT * FROM inscripcion WHERE cuil = ?`;
    const [results] = await pool.query(query, cuil);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  }
};

export default formModel;
