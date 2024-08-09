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


      // Procesa las imágenes
      const images = req.files["images"]
        ? req.files["images"].map((file) => file.path)
        : [];
      
      // Procesa el PDF
      const pdf = req.files["pdf"] ? req.files["pdf"][0].path : null;

      // Asegúrate de que `req.params.id` esté definido
      const noticiaId = req.params.id;

      // Actualiza la noticia en la base de datos (suponiendo que tengas un modelo para esto)
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
