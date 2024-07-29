import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const usuariosAdminModel = {
  getAll: async () => {
    const query = `SELECT * FROM usuarios WHERE rol = 'admin'`;
    const [results] = await pool.query(query);

    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  },

  update: async (id, userData) => {
    try {
      const query = `UPDATE usuarios SET ? WHERE id = ?`;
      const [results] = await pool.query(query, [userData, id]);
      return results;
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      throw error;
    }
  },

  addAdmin: async (userData) => {
    try {
      const query = `INSERT INTO usuarios SET ?`;
      const [results] = await pool.query(query, userData);
      return results;
    } catch (error) {
      console.error("Error al añadir usuario:", error);
      throw error;
    }
  },
  
};

export default usuariosAdminModel;
