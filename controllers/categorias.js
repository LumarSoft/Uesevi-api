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

  editCategoria: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nombre, sueldo } = req.body;

      const result = await categoriasModel.editCategoria(id, nombre, sueldo);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  salarioFuturo: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { sueldo_futuro } = req.body;
      const { fecha_futuro } = req.body;


      const result = await categoriasModel.salarioFuturo(
        id,
        sueldo_futuro,
        fecha_futuro
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default categoriasController;
