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

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const escalasData = req.body;
      const result = await escalasModel.update(id, escalasData);
      if (result.affectedRows > 0) {
        res.json({
          message: "Archivo actualizado",
          updatedEscala: escalasData,
        });
      } else {
        res.status(404).json({ message: "Archivo no encontrado" });
      }
    } catch (error) {
      next(error);
    }
  },
};

export default escalasController;
