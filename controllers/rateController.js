import rateModel from "../models/rateModel.js";

const rateController = {
  getAll: async (req, res, next) => {
    try {
      const tasas = await rateModel.getAll();
      res.json(tasas);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { porcentaje } = req.body; // Obtener el campo porcentaje del body
      const { id } = req.params; // Obtener el ID del parámetro de la URL
      await rateModel.update(id, porcentaje); // Pasar el ID y porcentaje al modelo
      res.json({ message: "Tasa actualizada" });
    } catch (error) {
      next(error);
    }
  },
};

export default rateController;
