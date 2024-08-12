import escalasModel from "../models/escalasModel.js";

const escalasController = {
  getAll: async (req, res, next) => {
    try {
      const escalas = await escalasModel.getAll();
      res.json(escalas);
    } catch (error) {
      next(error);
    }
  },
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      await escalasModel.delete(id);
      res.json({ message: "Archivo eliminado" });
    } catch (error) {
      next(error);
    }
  },
};

export default escalasController;
