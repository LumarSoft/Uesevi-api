import { pool } from "../db/db.js";
import { formatDate, formatedHTML } from "../utils/utils.js";

const newsModel = {
  getLatest: async () => {
    const query =
      "SELECT n.* , i.nombre AS url FROM noticias n INNER JOIN imagenes_noticias i ON n.id = i.noticia_id LIMIT 3";
    const [results] = await pool.query(query);

    return results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      cuerpo: formatedHTML(result.cuerpo),
    }));
  },
};

export default newsModel;
