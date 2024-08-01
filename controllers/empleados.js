import empleadosModel from "../models/empleadosModel.js";

const empleadosController = {
  getAll: async (req, res, next) => {
    try {
      const empleados = await empleadosModel.getAll();
      res.json(empleados);
    } catch (error) {
      next(error);
    }
  }
};

export default empleadosController;
