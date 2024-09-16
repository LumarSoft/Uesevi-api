import categoryModel from "../models/categoryModel.js";

const categoryController = {
  getAll: async (req, res, next) => {
    try {
      const category = await categoryModel.getAll();
      res.json(category);
    } catch (error) {
      next(error);
    }
  },

  addCategory: async (req, res, next) => {
    try {
      const { name, salary } = req.body;

      const result = await categoryModel.addCategory(name, salary);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      const { id } = req.params;

      const result = await categoryModel.deleteCategory(id);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  editCategory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, salary } = req.body;

      const result = await categoryModel.editCategory(id, name, salary);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  futureSalary: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { futureSalary, dateChange } = req.body;

      const result = await categoryModel.futureSalary(
        id,
        futureSalary,
        dateChange
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default categoryController;
