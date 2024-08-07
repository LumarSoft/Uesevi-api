import { pool } from "../db/db.js";
import { formatDate, formatedHTML } from "../utils/utils.js";

const noticiasModel = {
  getAll: async () => {
    const query = "SELECT * FROM noticias ORDER BY created DESC";
    const [results] = await pool.query(query);

    return results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      cuerpo: formatedHTML(result.cuerpo),
    }));
  },

  getById: async (id) => {
    const query = "SELECT * FROM noticias WHERE id = ?";
    const [results] = await pool.query(query, [id]);

    return results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      cuerpo: formatedHTML(result.cuerpo),
    }));
  },

  addNoticia: async (data) => {
    //Ejemplo de lo que obtenemos como parametro
    // {
    //   headline: 'El marvo',
    //   epigraph: 'asd',
    //   entradilla: 'asdasdasd',
    //   body: 'asddddddddddddddd',
    //   images: [
    //     'uploads\\imagenes-noticia\\pixelcut-export.png',
    //     'uploads\\imagenes-noticia\\Vuvu.jpeg'
    //   ],
    //   pdf: 'uploads\\archivos-noticia\\CV.pdf'
    // }

    const { headline, epigraph, entradilla, body, images, pdf } = data;

    //Crear la noticia en la tabla noticias. El archivo tambien va en la tab;a noticias

    const queryInsertNoticia =
      "INSERT INTO noticias (headline, epigraph, entradilla, body, pdf) VALUES (?, ?, ?, ?, ?)";

    const [results] = await pool.query(queryInsertNoticia, [
      headline,
      epigraph,
      entradilla,
      body,
      pdf,
    ]);

    // obtener el id
    const idNoticia = results.insertId;

    const queryInsertImages =
      "INSERT INTO imagenes_noticias (noticia_id, nombre) VALUES (?, ?)";

    images.forEach(async (image) => {
      await pool.query(queryInsertImages, [idNoticia, image]);
    });

    return results;
  },

  updateNoticia: async (id, { headline, epigraph, entradilla, body }) => {
    const query =
      "UPDATE noticias SET headline = ?, epigraph = ?, entradilla = ?, body = ? WHERE id = ?";
    const [results] = await pool.query(query, [
      headline,
      epigraph,
      entradilla,
      body,
      id,
    ]);

    return results;
  },

  deleteNoticia: async (id) => {
    const query = "DELETE FROM noticias WHERE id = ?";
    const [results] = await pool.query(query, [id]);

    return results;
  },
};

export default noticiasModel;
