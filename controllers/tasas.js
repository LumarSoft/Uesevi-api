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
};

export default tasasController;
