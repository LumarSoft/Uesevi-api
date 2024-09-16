import { pool } from "../db/db.js";

const scaleModel = {
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

  update: async (id, newName) => {
    try {
      const query = `UPDATE archivos SET nombre = ?, modified = NOW() WHERE id = ?`;
      const [results] = await pool.query(query, [newName, id]);
      return results;
    } catch (e) {
      console.error(e);
    }
  },

  create: async (escalasData) => {
    try {
      const query =
        "INSERT INTO archivos (id, nombre, imagen,created, modified, status) values (?, ?, ?, NOW(), NOW(), 1);";

      const [results] = await pool.query(query, [
        escalasData.id,
        escalasData.name,
        escalasData.pdf,
      ]);

      return results;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
};

export default scaleModel;
