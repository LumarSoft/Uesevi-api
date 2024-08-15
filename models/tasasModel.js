import { set } from "date-fns";
import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const tasasModel = {
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

  update: async (id, porcentaje) => {
    const query = `UPDATE tasa SET porcentaje = ?, modified = ? WHERE id = ?;`;
    const now = new Date();
    const [results] = await pool.query(query, [porcentaje, now, id]);
    return results.affectedRows; // Retornar el número de filas afectadas
  },
};


export default tasasModel;
