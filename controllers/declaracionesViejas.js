import declaracionesViejasModel from "../models/declaracionesViejasModel.js";

const declaracionesViejasController = {
  getAll: async (req, res, next) => {
    try {
      const declaraciones = await declaracionesViejasModel.getAll();
      res.json(declaraciones);
    } catch (error) {
      next(error);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const declaracion = await declaracionesViejasModel.getOne(id);
      res.json(declaracion);
    } catch (error) {
      next(error);
    }
  },

  getInfo: async (req, res, next) => {
    try {
      const { idEmpresa, idDeclaracion } = req.params;
      const info = await declaracionesViejasModel.getInfo(idEmpresa, idDeclaracion);
      res.json(info);
    } catch (error) {
      next(error);
    }
  },
};

export default declaracionesViejasController;
