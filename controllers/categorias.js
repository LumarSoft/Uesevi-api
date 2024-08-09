import categoriasModel from "../models/categoriasModel.js";

const categoriasController = {
  getAll: async (req, res, next) => {
    try {
      const categorias = await categoriasModel.getAll();
      res.json(categorias);
    } catch (error) {
      next(error);
    }
  },

  addCategoria: async (req, res, next) => {
    try {
      const { nombre, sueldo } = req.body;
      console.log(nombre, sueldo);

      const result = await categoriasModel.addCategoria(nombre, sueldo);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  deleteCategoria: async (req, res, next) => {
    try {
      const { id } = req.params;

      const result = await categoriasModel.deleteCategoria(id);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default categoriasController;
