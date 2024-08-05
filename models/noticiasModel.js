import { pool } from "../db/db.js";
import { formatDate, formatedHTML } from "../utils/utils.js";

const noticiasModel = {
  getAll: async () => {
    const query = `SELECT * FROM noticias ORDER BY created DESC`;

    const [results] = await pool.query(query);

    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      cuerpo: formatedHTML(result.cuerpo),
    }));

    return formattedResults;
  },

  getById: async (id) => {
    const query = `SELECT * FROM noticias WHERE id = ?`;

    const [results] = await pool.query(query, [id]);

    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      cuerpo: formatedHTML(result.cuerpo),
    }));

    return formattedResults;
  },

  addNoticia: async (titulo, contenido) => {
    const query = `INSERT INTO noticias (titulo, contenido) VALUES (?, ?)`;

    const [results] = await pool.query(query, [titulo, contenido]);

    return results;
  },
  updateNoticia: async (id, titulo, contenido) => {
    const query = `UPDATE noticias SET titulo = ?, contenido = ? WHERE id = ?`;

    const [results] = await pool.query(query, [titulo, contenido, id]);

    return results;
  },

  deleteNoticia: async (id) => {
    const query = `DELETE FROM noticias WHERE id = ?`;

    const [results] = await pool.query(query, [id]);

    return results;
  },
};

export default noticiasModel;
