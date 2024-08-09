import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const categoriasModel = {
  getAll: async () => {
    const query = "SELECT * FROM categorias";

    const [results] = await pool.query(query);

    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
    }));

    return formattedResults;
  },

  addCategoria: async (nombre, sueldo) => {
    //Nos traemos el ultimo id

    const queryId = "SELECT id FROM categorias ORDER BY id DESC LIMIT 1";

    const [resultId] = await pool.query(queryId);

    const query =
      "INSERT INTO categorias (id, nombre, sueldo_basico, created,modified) VALUES (?,?,?, NOW(), NOW())";

    const [result] = await pool.query(query, [resultId[0].id + 1, nombre, sueldo]);

    return result;
  },

  deleteCategoria: async (id) => {
    const query = "DELETE FROM categorias WHERE id = ?";

    const [result] = await pool.query(query, [id]);

    return result;
  },
};

export default categoriasModel;
