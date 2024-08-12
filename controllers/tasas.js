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
      const { porcentaje } = req.body;
      await tasasModel.update(porcentaje);
      res.json({message: "Tasa actualizada"});
    } catch (error) {
      next(error);
    }
  },
};

export default tasasController;
