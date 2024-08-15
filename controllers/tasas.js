import tasasModel from "../models/tasasModel.js";

const tasasController = {
  getAll: async (req, res, next) => {
    try {
      const tasas = await tasasModel.getAll();
      res.json(tasas);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { porcentaje } = req.body; // Obtener el campo porcentaje del body
      const { id } = req.params; // Obtener el ID del parámetro de la URL
      await tasasModel.update(id, porcentaje); // Pasar el ID y porcentaje al modelo
      res.json({ message: "Tasa actualizada" });
    } catch (error) {
      next(error);
    }
  },
};


export default tasasController;
