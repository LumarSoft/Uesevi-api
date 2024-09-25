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

  addEmployee: async (req, res, next) => {
    try {
      const {
        firstName,
        lastName,
        cuil,
        category,
        employmentStatus,
        unionAdhesion,
        email,
        company,
      } = req.body;
      await employeesModel.addEmployee(
        firstName,
        lastName,
        cuil,
        category,
        employmentStatus,
        unionAdhesion,
        email,
        company
      );
      res.json({ message: "Employee added" });
    } catch (error) {
      next(error);
    }
  },
};

export default employeesController;
