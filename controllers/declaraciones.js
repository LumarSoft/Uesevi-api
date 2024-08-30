import declaracionesModel from "../models/declaraciones.js";

const declaracionesController = {
  getAll: async (req, res, next) => {
    try {
      const declaraciones = await declaracionesModel.getAll();
      res.json(declaraciones);
    } catch (error) {
      next(error);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const declaracion = await declaracionesModel.getOne(id);
      res.json(declaracion);
    } catch (error) {
      next(error);
    }
  },

  getHistory: async (req, res, next) => {
    try {
      const { idEmpresa, year, month } = req.params;
      const history = await declaracionesModel.getHistory(
        idEmpresa,
        year,
        month
      );
      res.json(history);
    } catch (error) {
      next(error);
    }
  },

  changeState: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { state } = req.body;
      await declaracionesModel.changeState(id, state);
      res.json({ message: "Estado de la declaración actualizado" });
    } catch (error) {
      next(error);
    }
  },

  changeDatePayment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { fecha } = req.body;
      await declaracionesModel.changeDatePayment(id, fecha);
      res.json({ message: "Fecha de pago actualizada" });
    } catch (error) {
      next(error);
    }
  },
};

export default declaracionesController;
