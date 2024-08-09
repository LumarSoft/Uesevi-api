import noticiasModel from "../models/noticiasModel.js";

const noticiasController = {
  getAll: async (req, res, next) => {
    try {
      const noticias = await noticiasModel.getAll();
      res.json(noticias);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const noticia = await noticiasModel.getById(id);
      res.json(noticia);
    } catch (error) {
      next(error);
    }
  },

  addNoticia: async (req, res, next) => {
    try {
      const { titulo, epigrafe, cuerpo, cuerpo2, destinatario } = req.body;

      //Validar que llleguen los valores obligatorios: destinatario, titulo,epigrafe, cuerpo

      if (!destinatario || !titulo || !epigrafe || !cuerpo) {
        const error = new Error("Faltan campos obligatorios");
        error.httpStatus = 400;
        throw error;
      }

      const images = req.files["images"]
        ? req.files["images"].map((file) => file.path)
        : [];
      const pdf = req.files["pdf"] ? req.files["pdf"][0].path : null;

      const result = await noticiasModel.addNoticia({
        titulo,
        epigrafe,
        cuerpo,
        cuerpo2,
        destinatario,
        images,
        pdf,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  updateNoticia: async (req, res, next) => {
    try {
      const { titulo, epigrafe, cuerpo, cuerpo2, destinatario } = req.body;
      const noticiaId = req.params.id;

      // Procesa las imágenes nuevas
      const newImages = req.files["images"]
        ? req.files["images"].map((file) => file.path)
        : [];

      // Obtén las imágenes existentes
      const existingNoticia = await noticiasModel.getById(noticiaId);
      const existingImages = existingNoticia.images || [];

      // Si hay imágenes nuevas, reemplaza las existentes, si no, conserva las antiguas
      const images = newImages.length > 0 ? newImages : existingImages;

      // Procesa el PDF
      const pdf = req.files["pdf"]
        ? req.files["pdf"][0].path
        : existingNoticia.pdf;

      // Actualiza la noticia en la base de datos
      const result = await noticiasModel.updateNoticia({
        id: noticiaId,
        titulo,
        epigrafe,
        cuerpo,
        cuerpo2,
        destinatario,
        images,
        pdf,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  deleteNoticia: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await noticiasModel.deleteNoticia(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default noticiasController;
