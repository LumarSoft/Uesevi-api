import newsModel from "../models/newsModel.js";

const newsController = {
  getAll: async (req, res, next) => {
    try {
      const news = await newsModel.getAll();
      res.json(news);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const news = await newsModel.getById(id);
      res.json(news);
    } catch (error) {
      next(error);
    }
  },

  addNew: async (req, res, next) => {
    try {
      const { headline, epigraph, body, body2, addressee } = req.body;

      //Validar que llleguen los valores obligatorios: destinatario, titulo,epigrafe, cuerpo

      if (!headline || !body || !addressee) {
        const error = new Error("Faltan campos obligatorios");
        error.httpStatus = 400;
        throw error;
      }

      // Guardar solo el nombre del archivo en lugar del path completo
      const images = req.files["images"]
        ? req.files["images"].map((file) => file.filename)
        : [];
      const pdf = req.files["pdf"] ? req.files["pdf"][0].filename : null;

      console.log(images, pdf);

      const result = await newsModel.addNew({
        headline,
        epigraph,
        body,
        body2,
        addressee,
        images,
        pdf,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  updateNew: async (req, res, next) => {
    try {
      const { headline, epigraph, body, body2, addressee } = req.body;
      const newId = req.params.id;

      // Procesa las imágenes nuevas
      const newImages = req.files["images"]
        ? req.files["images"].map((file) => file.filename)
        : [];

      // Obtén las imágenes existentes
      const existingNew = await newsModel.getById(newId);
      const existingImages = existingNew.images || [];

      // Si hay imágenes nuevas, reemplaza las existentes, si no, conserva las antiguas
      const images = newImages.length > 0 ? newImages : existingImages;

      // Procesa el PDF
      const pdf = req.files["pdf"] ? req.files["pdf"][0].path : existingNew.pdf;

      // Actualiza la noticia en la base de datos
      const result = await newsModel.updateNew({
        id: newId,
        headline,
        epigraph,
        body,
        body2,
        addressee,
        images,
        pdf,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  deleteNew: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await newsModel.deleteNew(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default newsController;
