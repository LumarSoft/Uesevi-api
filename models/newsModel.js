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

  addNew: async (data) => {
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

    const { headline, epigraph, body, body2, addressee, images, pdf } = data;

    const [results] = await pool.query(query, [
      lastId + 1,
      headline,
      epigraph,
      body,
      body2,
      addressee,
      pdf,
    ]);

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

  updateNew: async (data) => {
    const { id, headline, epigraph, body, body2, addressee, images, pdf } =
      data;

    // Consulta para obtener el último id de imágenes
    const queryLastIdImages =
      "SELECT id FROM imagenes_noticias ORDER BY id DESC LIMIT 1";
    const [resultsLastIdImages] = await pool.query(queryLastIdImages);
    const lastIdImages =
      resultsLastIdImages.length > 0 ? resultsLastIdImages[0].id : 0;

    // Actualización de la noticia

    if (!headline || !body || !addressee) {
      const error = new Error("Faltan campos obligatorios");
      error.httpStatus = 400;
      throw error;
    }
    
    const query =
      "UPDATE noticias SET titulo = ?, epigrafe = ?, cuerpo = ?, cuerpo_secundario = ?, destinatario = ?, archivo = ?, modified = NOW() WHERE id = ?";
    const [results] = await pool.query(query, [
      headline,
      epigraph,
      body,
      body2,
      addressee,
      pdf,
      id,
    ]);

    // Eliminación de todas las imágenes asociadas a esta noticia
    const queryDeleteImages =
      "DELETE FROM imagenes_noticias WHERE noticia_id = ?";
    await pool.query(queryDeleteImages, [id]);

    // Inserción de nuevas imágenes
    const queryInsertImages =
      "INSERT INTO imagenes_noticias (id, noticia_id, nombre, created, modified) VALUES (?, ?, ?, NOW(), NOW())";

    // Verifica si `images` es un array de objetos o de strings
    if (images.length > 0 && typeof images[0] === "string") {
      // Opción 1: Solo rutas de imágenes nuevas
      images.forEach(async (image, index) => {
        await pool.query(queryInsertImages, [
          lastIdImages + index + 1,
          id,
          image,
        ]);
      });
    } else if (images.length > 0 && typeof images[0] === "object") {
      // Opción 2: Imágenes existentes que deseas conservar
      images.forEach(async (image) => {
        await pool.query(queryInsertImages, [
          image.id,
          image.noticia_id,
          image.nombre,
          image.created,
          image.modified,
        ]);
      });
    }

    return results;
  },

  deleteNew: async (id) => {
    const query = "DELETE FROM noticias WHERE id = ?";
    const [results] = await pool.query(query, [id]);

    return results;
  },
};

export default noticiasModel;
