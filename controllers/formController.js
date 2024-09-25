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
      const { id } = req.params;
      const { company_provisory_name } = req.body;
      await formularioModel.changeCompany(id, company_provisory_name);
      res.json({ message: "Empresa de formulario actualizada" });
    } catch (error) {
      next(error);
    }
  },
};

export default formController;
