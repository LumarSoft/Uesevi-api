import { pool } from "../db/db.js";

const escalasModel = {
  getAll: async () => {
    const query =
      "SELECT * FROM archivos WHERE status = 1 ORDER BY created DESC;";

    const [results] = await pool.query(query);

    return results;
  },

  delete: async (id) => {
    try {
      const query = `DELETE FROM archivos WHERE id = ?;`;
      const [results] = await pool.query(query, [id]);
      return results;
    } catch (e) {
      console.error(e);
    }
  },

  update: async (id, escalasData) => {
    try {
      const query = `UPDATE archivos SET ? WHERE id = ?;`;
      const [results] = await pool.query(query, [escalasData, id]);
      return results;
    } catch (e) {
      console.error(e);
    }
  },
};

export default escalasModel;
