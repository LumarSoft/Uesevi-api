import oldCompaniesModel from "../models/oldCompaniesModel.js";

const oldCompaniesController = {
  getAll: async (req, res, next) => {
    try {
      const companies = await oldCompaniesModel.getAll();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  },
};

export default oldCompaniesController;
