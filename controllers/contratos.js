import contratosModel from "../models/contratosModel.js";

const contratosController = {
  getAll: async (req, res, next) => {
    try {
      const contratos = await contratosModel.getAll();
      res.json(contratos);
    } catch (error) {
      next(error);
    }
  },
};

export default contratosController;
