import formularioModel from "../models/formularioModel.js";

const formularioController = {
  getAll: async (req, res, next) => {
    try {
      const formulario = await formularioModel.getAll();
      res.json(formulario);
    } catch (error) {
      next(error);
    }
  },

  changeEmpresa: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { empresa } = req.body;
      await formularioModel.changeEmpresa(id, empresa);
      res.json({ message: "Empresa de formulario actualizada" });
    } catch (error) {
      next(error);
    }
  },
};

export default formularioController;
