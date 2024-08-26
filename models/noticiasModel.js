import { pool } from "../db/db.js";
import { formatDate, formatedHTML } from "../utils/utils.js";

const noticiasModel = {
  getAll: async () => {
    const query =
      "SELECT n.* , i.nombre as url from noticias n inner join imagenes_noticias i on n.id = i.noticia_id";

    const [results] = await pool.query(query);

    return results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      cuerpo: formatedHTML(result.cuerpo),
    }));
  },

  getById: async (id) => {
    // Consulta que trae la información de la noticia y sus imágenes asociadas
    const query = `
      SELECT 
        n.*, 
        i.nombre as url 
      FROM 
        noticias n 
      LEFT JOIN 
        imagenes_noticias i 
      ON 
        n.id = i.noticia_id 
      WHERE 
        n.id = ?
    `;

    const [results] = await pool.query(query, [id]);

    if (results.length === 0) {
      return null; // Si no se encuentra la noticia, devuelve null o maneja según sea necesario
    }

    // Formatea la noticia y sus imágenes
    const noticia = {
      ...results[0],
      created: formatDate(results[0].created),
      modified: formatDate(results[0].modified),
      cuerpo: formatedHTML(results[0].cuerpo),
      images: results.map((row) => row.url).filter((url) => url), // Filtra las URLs no nulas
    };

    return noticia;
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

  updateNoticia: async (data) => {
    const { titulo, epigrafe, cuerpo, cuerpo2, destinatario, pdf, id, images } =
      data;

    // Consulta para obtener el último id de imágenes
    const queryLastIdImages =
      "SELECT id FROM imagenes_noticias ORDER BY id DESC LIMIT 1";
    const [resultsLastIdImages] = await pool.query(queryLastIdImages);
    const lastIdImages =
      resultsLastIdImages.length > 0 ? resultsLastIdImages[0].id : 0;

    // Actualización de la noticia
    const query =
      "UPDATE noticias SET titulo = ?, epigrafe = ?, cuerpo = ?, cuerpo_secundario = ?, destinatario = ?, archivo = ?, modified = NOW() WHERE id = ?";
    const [results] = await pool.query(query, [
      titulo,
      epigrafe,
      cuerpo,
      cuerpo2,
      destinatario,
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

  deleteNoticia: async (id) => {
    const query = "DELETE FROM noticias WHERE id = ?";
    const [results] = await pool.query(query, [id]);

    return results;
  },

  getLatest: async () => {
    const query =
      "SELECT n.* , i.nombre AS url FROM noticias n INNER JOIN imagenes_noticias i ON n.id = i.noticia_id";
    const [results] = await pool.query(query);

    return results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      cuerpo: formatedHTML(result.cuerpo),
    }));
  },
};

export default noticiasModel;
