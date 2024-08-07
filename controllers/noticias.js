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
      const { headline, epigraph, entradilla, body } = req.body;
      const images = req.files["images"]
        ? req.files["images"].map((file) => file.path)
        : [];
      const pdf = req.files["pdf"] ? req.files["pdf"][0].path : null;

      const result = await noticiasModel.addNoticia({
        headline,
        epigraph,
        entradilla,
        body,
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
      const { id } = req.params;
      const { headline, epigraph, entradilla, body } = req.body;
      const result = await noticiasModel.updateNoticia(id, {
        headline,
        epigraph,
        entradilla,
        body,
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
