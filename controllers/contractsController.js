import contratosModel from "../models/contractsModel.js";

const contractsController = {
  getAll: async (req, res, next) => {
    try {
      const contracts = await contratosModel.getAll();
      res.json(contracts);
    } catch (error) {
      next(error);
    }
  },
};

export default contractsController;
