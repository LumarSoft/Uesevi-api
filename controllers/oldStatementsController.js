import oldStatementsModel from "../models/oldStatementsModel.js";

const oldStatementsController = {
  getAll: async (req, res, next) => {
    try {
      const statements = await oldStatementsModel.getAll();
      res.json(statements);
    } catch (error) {
      next(error);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const statements = await oldStatementsModel.getOne(id);
      res.json(statements);
    } catch (error) {
      next(error);
    }
  },

  getInfo: async (req, res, next) => {
    try {
      const { idCompany, idStatement } = req.params;
      const info = await oldStatementsModel.getInfo(idCompany, idStatement);
      res.json(info);
    } catch (error) {
      next(error);
    }
  },
};

export default oldStatementsController;
