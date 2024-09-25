// models/empresasModel.js
import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const oldCompaniesModel = {
  getAll: async () => {
    const query = `SELECT * FROM old_empresas WHERE id IN (SELECT DISTINCT old_empresa_id FROM old_declaraciones_juradas)`;
    const [results] = await pool.query(query);

    return results;
  },
};

export default oldCompaniesModel;
