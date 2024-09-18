import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const formModel = {
  getAll: async () => {
    const query = `SELECT CONCAT(nombre, ' ', apellido) as nombre, cuil, created, empresa FROM inscripcion`;
    const [results] = await pool.query(query);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  },

  changeCompany: async (id, empresa) => {
    try {
      const query = `UPDATE inscripcion SET empresa = ? WHERE cuil = ?`;

      const [results] = await pool.query(query, [empresa, id]);

      return results;
    } catch (error) {
      console.error(error);
    }
  },

  getToComplete: async () => {
    const query = `SELECT * FROM inscripciones WHERE cuil = ?`;
    const [results] = await pool.query(query);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      fecha_nacimiento: formatDate(result.fecha_nacimiento),
    }));

    return formattedResults;
    //Devolver los datos de la persona, para en el front agarrarlos y armar la nueva ficha de inscripcion autocompletada.
  }
};

export default formModel;
