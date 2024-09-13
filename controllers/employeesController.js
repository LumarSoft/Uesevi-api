import employeesModel from "../models/employeesModel.js";

const employeesController = {
  getAll: async (req, res, next) => {
    try {
      const employees = await employeesModel.getAll();
      res.json(employees);
    } catch (error) {
      next(error);
    }
  },

  getByCompany: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employees = await employeesModel.getByEmpresa(id);
      res.json(employees);
    } catch (error) {
      next(error);
    }
  },

  getOldByCompany: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employees = await employeesModel.getOldByEmpresa(id);
      res.json(employees);
    } catch (error) {
      next(error);
    }
  },
};

export default employeesController;
