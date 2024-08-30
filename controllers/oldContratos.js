import oldContratosModel from "../models/oldContratosModel.js";

const oldContratosController = {
  getAll: async (req, res, next) => {
    try {
      const contratos = await oldContratosModel.getAll();
      res.json(contratos);
    } catch (error) {
      next(error);
    }
  },
};

export default oldContratosController;