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
    //Primero traer toda la info de la tabla noticias dependiendo del id
    const query = "SELECT * FROM noticias WHERE id = ?";
    const [results] = await pool.query(query, [id]);

    //Luego traer todas las imagenes asociadas a esa noticia
    const queryImages = "SELECT * FROM imagenes_noticias WHERE noticia_id = ?";

    const [resultsImages] = await pool.query(queryImages, [id]);

    //Luego retornar todo en un mismo objeto
    return {
      ...results[0],
      created: formatDate(results[0].created),
      modified: formatDate(results[0].modified),
      cuerpo: formatedHTML(results[0].cuerpo),
      images: resultsImages,
    };
  },

  addNoticia: async (data) => {
    //Primero nos traemos el ultimo id de las noticias presente en la tabla noticias
    const queryLastId = "SELECT id FROM noticias ORDER BY id DESC LIMIT 1";
    const [resultsLastId] = await pool.query(queryLastId);
    const lastId = resultsLastId[0].id;

    //Luego nos traemos el ultimo id de las imagenes_noticias presente en la tabla imagenes_noticias
    const queryLastIdImages =
      "SELECT id FROM imagenes_noticias ORDER BY id DESC LIMIT 1";
    const [resultsLastIdImages] = await pool.query(queryLastIdImages);
    const lastIdImages = resultsLastIdImages[0].id;

    const query =
      "INSERT INTO noticias (id, titulo, epigrafe, cuerpo, cuerpo_secundario, destinatario, archivo, created, modified) values (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";

    const { titulo, epigrafe, cuerpo, cuerpo2, destinatario, pdf } = data;

    const [results] = await pool.query(query, [
      lastId + 1,
      titulo,
      epigrafe,
      cuerpo,
      cuerpo2,
      destinatario,
      pdf,
    ]);

    const images = data.images;

    const queryInsertImages =
      "INSERT INTO imagenes_noticias (id,noticia_id, nombre) VALUES (?, ?, ?)";

    //Las imagenes pueden ser varias y tienen que sumar 1 en el id dependiendo de la ultima inserccion

    images.forEach(async (image, index) => {
      await pool.query(queryInsertImages, [
        lastIdImages + index + 1,
        lastId + 1,
        image,
      ]);
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
