import { pool } from "../db/db.js";
import { formatDate, formatedHTML } from "../utils/utils.js";

const noticiasModel = {
  getAll: async () => {
    const query = `
      SELECT 
        n.*,
        (SELECT nombre FROM imagenes_noticias WHERE noticia_id = n.id ORDER BY id ASC LIMIT 1) as cover_image
      FROM noticias n 
      ORDER BY created DESC
    `;
    const [results] = await pool.query(query);

    return results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      cuerpo: formatedHTML(result.cuerpo),
      cover_image: result.cover_image || null,
    }));
  },

  getLastThree: async () => {
    const query = `
      SELECT 
        n.*,
        (SELECT nombre FROM imagenes_noticias WHERE noticia_id = n.id ORDER BY id ASC LIMIT 1) as cover_image
      FROM noticias n 
      ORDER BY created DESC 
      LIMIT 3
    `;
    const [results] = await pool.query(query);

    return results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
      cuerpo: formatedHTML(result.cuerpo),
      cover_image: result.cover_image || null,
    }));
  },

  getAllClient: async (offset, limit) => {
    const query = `
    SELECT 
      n.*, 
      GROUP_CONCAT(i.nombre ORDER BY i.id ASC) as images,
      (SELECT nombre FROM imagenes_noticias WHERE noticia_id = n.id ORDER BY id ASC LIMIT 1) as cover_image
    FROM 
      noticias n 
    LEFT JOIN 
      imagenes_noticias i 
    ON 
      n.id = i.noticia_id 
    GROUP BY 
      n.id 
    ORDER BY 
      n.created DESC 
    LIMIT ?, ?
  `;

    const [results] = await pool.query(query, [
      parseInt(offset),
      parseInt(limit),
    ]);

    const countQuery = "SELECT COUNT(*) as total FROM noticias";
    const [countResult] = await pool.query(countQuery);
    const totalNoticias = countResult[0].total;

    const totalPages = Math.ceil(totalNoticias / limit);

    return {
      noticias: results.map((result) => ({
        ...result,
        created: formatDate(result.created),
        modified: formatDate(result.modified),
        cuerpo: formatedHTML(result.cuerpo),
        cover_image: result.cover_image || null,
        images: result.images ? result.images.split(",") : [],
      })),
      totalPages,
    };
  },

  getById: async (id) => {
    //Primero traer toda la info de la tabla noticias dependiendo del id
    const query = "SELECT * FROM noticias WHERE id = ?";
    const [results] = await pool.query(query, [id]);

    //Luego traer todas las imagenes asociadas a esa noticia ordenadas por ID (primera = portada)
    const queryImages =
      "SELECT * FROM imagenes_noticias WHERE noticia_id = ? ORDER BY id ASC";

    const [resultsImages] = await pool.query(queryImages, [id]);

    //Luego retornar todo en un mismo objeto
    return {
      ...results[0],
      created: formatDate(results[0].created),
      modified: formatDate(results[0].modified),
      cuerpo: formatedHTML(results[0].cuerpo),
      images: resultsImages,
      cover_image: resultsImages.length > 0 ? resultsImages[0].nombre : null,
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
      "INSERT INTO imagenes_noticias (id, noticia_id, nombre, created, modified) VALUES (?, ?, ?, NOW(), NOW())";

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

    // Validar campos obligatorios (addressee puede ser null cuando es "todos")
    if (!headline || !body) {
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

    // Inserción de imágenes (nuevas y existentes que se conservan)
    const queryInsertImagesNew =
      "INSERT INTO imagenes_noticias (id, noticia_id, nombre, created, modified) VALUES (?, ?, ?, NOW(), NOW())";

    const queryInsertImagesExisting =
      "INSERT INTO imagenes_noticias (id, noticia_id, nombre, created, modified) VALUES (?, ?, ?, ?, NOW())";

    let currentImageId = lastIdImages + 1;

    // Procesar todas las imágenes (existentes y nuevas)
    for (const image of images) {
      if (typeof image === "string") {
        // Es una imagen nueva (solo nombre de archivo)
        await pool.query(queryInsertImagesNew, [currentImageId, id, image]);
        currentImageId++;
      } else if (typeof image === "object" && image.nombre) {
        // Es una imagen existente que se conserva (preservar fecha de creación original)
        await pool.query(queryInsertImagesExisting, [
          currentImageId,
          id,
          image.nombre,
          image.created, // Preservar fecha de creación original
        ]);
        currentImageId++;
      }
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
