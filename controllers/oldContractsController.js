import oldContractsModel from "../models/oldContractsModel.js";

const oldContractsController = {
  getAll: async (req, res, next) => {
    try {
      const contracts = await oldContractsModel.getAll();
      res.json(contracts);
    } catch (error) {
      next(error);
    }
  },
};

export default oldContractsController;
