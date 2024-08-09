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

  update: async (porcentaje) => {
    const query = `UPDATE tasa SET porcentaje = ?, modified = ?, created = ?;`;

    const now = new Date();

    const [results] = await pool.query(query, [porcentaje, now, now]);

    return results.insertId;
  },
};

export default tasasModel;
