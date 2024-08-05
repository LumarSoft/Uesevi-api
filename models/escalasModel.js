import { pool } from "../db/db.js";

const escalasModel = {
  getAll: async () => {
    const query = `SELECT * FROM archivos;`;

    const [results] = await pool.query(query);

    return results;
  },
};

export default escalasModel;
