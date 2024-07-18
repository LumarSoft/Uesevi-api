import { pool } from "../db/db.js";

const noticiasModel = {
  getAll: async () => {
    const query = `SELECT * FROM noticias ORDER BY created DESC`;

    const [results] = await pool.query(query);

    return results;
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
};

export default noticiasModel;
