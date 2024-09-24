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
    } catch (error) {}
  },

  editEmployee: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        cuil,
        category,
        employmentStatus,
        unionMembership,
      } = req.body;

      await employeesModel.editEmployee(
        id,
        firstName,
        lastName,
        cuil,
        category,
        employmentStatus,
        unionMembership
      );
      res.json({ message: "Employee updated" });
    } catch (error) {}
  },

  deleteEmployee: async (req, res, next) => {
    try {
      const { id } = req.params;
      await employeesModel.deleteEmployee(id);
      res.json({ message: "Employee deleted" });
    } catch (error) {
      next(error);
    }
  },
};

export default employeesController;
