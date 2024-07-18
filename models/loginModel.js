// Aca irán las querys
import { pool } from "../db/db.js";

const loginModel = {
  getUser: async (email) => {
    const query = `SELECT * FROM usuarios WHERE email = ? `;

    const [results] = await pool.query(query, [email]);

    return results;
  },
};

export default loginModel;
