import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const categoryModel = {
  getAll: async () => {
    const query = "SELECT * FROM categorias ORDER BY id DESC";

    const [results] = await pool.query(query);

    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      fecha_vigencia: formatDate(result.fecha_vigencia),
    }));

    return formattedResults;
  },

  addCategory: async (name, salary) => {
    //Nos traemos el ultimo id

    const queryId = "SELECT id FROM categorias ORDER BY id DESC LIMIT 1";

    const [resultId] = await pool.query(queryId);

    const query =
      "INSERT INTO categorias (id, nombre, sueldo_basico, created,modified) VALUES (?,?,?, NOW(), NOW())";

    const [result] = await pool.query(query, [
      resultId[0].id + 1,
      name,
      salary,
    ]);

    return result;
  },

  deleteCategory: async (id) => {
    const query = "DELETE FROM categorias WHERE id = ?";

    const [result] = await pool.query(query, [id]);

    return result;
  },

  editCategory: async (id, nombre, sueldo) => {
    const query =
      "UPDATE categorias SET nombre = ?, sueldo_basico = ?, modified = NOW() WHERE id = ?";

    const [result] = await pool.query(query, [nombre, sueldo, id]);

    return result;
  },

  futureSalary: async (id, sueldo_futuro, fecha_futuro) => {
    const query =
      "UPDATE categorias SET sueldo_futuro = ?, fecha_vigencia = ?, modified = NOW() WHERE id = ?";

    const [result] = await pool.query(query, [sueldo_futuro, fecha_futuro, id]);

    return result;
  },
};

export default categoryModel;
