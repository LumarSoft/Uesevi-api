import oldEmpresasModel from "../models/oldEmpresasModel.js";

const oldEmpresasController = {
  getAll: async (req, res, next) => {
    try {
      const empresas = await oldEmpresasModel.getAll();
      res.json(empresas);
    } catch (error) {
      next(error);
    }
  },
};

export default oldEmpresasController;
