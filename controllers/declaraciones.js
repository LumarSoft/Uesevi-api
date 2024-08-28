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

  changeState: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { state } = req.body;
      await declaracionesModel.changeState(id, state);
      res.json({ message: "Estado de la declaración actualizado" });
    } catch (error) {
      next(error);
    }
  },
};

export default declaracionesController;
