import { pool } from "../db/db.js";

const basicSalaryModel = {
  getBasicSalary: async () => {
    const query = `SELECT sueldo_basico FROM categorias WHERE id = 1`;
    const [results] = await pool.query(query);
    return results;
  },
};

export default basicSalaryModel;
