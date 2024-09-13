import companiesModel from "../models/companiesModel.js";

const companiesController = {
  getAll: async (req, res, next) => {
    try {
      const empresas = await companiesModel.getAll();
      res.json(empresas);
    } catch (error) {
      next(error);
    }
  },

  changeState: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { state } = req.body;
      await companiesModel.changeState(id, state);
      res.json({ message: "Estado de la empresa actualizado" });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      await companiesModel.delete(id);
      res.json({ message: "Empresa eliminada" });
    } catch (error) {
      next(error);
    }
  },
};

export default companiesController;
