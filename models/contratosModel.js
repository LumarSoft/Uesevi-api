import { pool } from "../db/db.js";

const contratosModel = {
  getAll: async () => {
    const query = "SELECT * FROM contratos";
    const [rows] = await pool.query(query);
    return rows;
  },
};

export default contratosModel;