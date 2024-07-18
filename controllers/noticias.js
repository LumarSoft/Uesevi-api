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
  
  addNoticia: async (req, res, next) => {
    try {
      const { titulo, contenido } = req.body;
      const result = await noticiasModel.addNoticia(titulo, contenido);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  updateNoticia: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { titulo, contenido } = req.body;
      const result = await noticiasModel.updateNoticia(id, titulo, contenido);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default noticiasController;
