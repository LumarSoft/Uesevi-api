import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const rateModel = {
  getAll: async () => {
    const query = `SELECT * FROM tasa;`;
    const [results] = await pool.query(query);
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
    }));
    return formattedResults;
  },

  update: async (id, percentage) => {
    //Pasamos percentage a decimal
    percentage = parseFloat(percentage);
    const query = `UPDATE tasa SET porcentaje = ?, modified = now() WHERE id = ?;`;
    const [results] = await pool.query(query, [percentage, id]);
    return results.affectedRows; // Retornar el número de filas afectadas
  },
};

export default rateModel;
