import declaracionesViejasModel from "../models/declaracionesViejasModel.js";

const declaracionesViejasController = {
  getAll: async (req, res, next) => {
    try {
      const tasas = await declaracionesViejasModel.getAll();
      res.json(tasas);
    } catch (error) {
      next(error);
    }
  },
};

export default declaracionesViejasController;
