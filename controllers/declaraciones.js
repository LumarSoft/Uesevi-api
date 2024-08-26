import declaracionesModel from "../models/declaraciones.js";

const declaracionesController = {
  getAll: async (req, res, next) => {
    try {
      const declaraciones = await declaracionesModel.getAll();
      res.json(declaraciones);
    } catch (error) {
      next(error);
    }
  },
};

export default declaracionesController;
