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
};

export default tasasModel;
