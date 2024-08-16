import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const declaracionesViejasModel = {
  getAll: async () => {
    const query = `SELECT * FROM old_declaraciones_juradas;`;
    const [results] = await pool.query(query);
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
    }));
    return formattedResults;
  },
};


export default declaracionesViejasModel;
