import empresasModel from "../models/empresasModel.js";

const empresasController = {
  getAll: async (req, res, next) => {
    try {
      const empresas = await empresasModel.getAll();
      res.json(empresas);
    } catch (error) {
      next(error);
    }
  },

  changeState: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      await empresasModel.changeState(id, estado);
      res.json({ message: "Estado de la empresa actualizado" });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      await empresasModel.delete(id);
      res.json({ message: "Empresa eliminada" });
    } catch (error) {
      next(error);
    }
  },
};

export default empresasController;
