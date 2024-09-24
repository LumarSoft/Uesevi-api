import formularioModel from "../models/formModel.js";

const formController = {
  getAll: async (req, res, next) => {
    try {
      const formulario = await formularioModel.getAll();
      res.json(formulario);
    } catch (error) {
      next(error);
    }
  },

  changeCompany: async (req, res, next) => {
    try {
      const { cuil } = req.params;
      const { empresa } = req.body;
      await formularioModel.changeCompany(cuil, empresa);
      res.json({ message: "Empresa de formulario actualizada" });
    } catch (error) {
      next(error);
    }
  },

  getToComplete: async (req, res, next) => {
    try {
      const { cuil } = req.params;
      const formulario = await formularioModel.getToComplete(cuil);
      res.json(formulario);
    } catch (error) {
      next(error);
    }
  },

  createRequest: async (req, res, next) => {
    try {
      const data = req.body;

      await formularioModel.createRequest(data);
      res.json({ message: "Formulario creado" });
    } catch (error) {}
  },
};

export default formController;
