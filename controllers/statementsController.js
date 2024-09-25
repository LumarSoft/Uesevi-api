import statementsModel from "../models/statementsModel.js";

const statementsController = {
  getAll: async (req, res, next) => {
    try {
      const declaraciones = await statementsModel.getAll();
      res.json(declaraciones);
    } catch (error) {
      next(error);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const declaracion = await statementsModel.getOne(id);
      res.json(declaracion);
    } catch (error) {
      next(error);
    }
  },

  getInfo: async (req, res, next) => {
    try {
      const { idEmpresa, idDeclaracion } = req.params;
      const info = await statementsModel.getInfo(idEmpresa, idDeclaracion);
      res.json(info);
    } catch (error) {
      next(error);
    }
  },

  getHistory: async (req, res, next) => {
    try {
      const { idEmpresa, year, month } = req.params;
      const history = await statementsModel.getHistory(idEmpresa, year, month);
      res.json(history);
    } catch (error) {
      next(error);
    }
  },

  changeState: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { state } = req.body;
      await statementsModel.changeState(id, state);
      res.json({ message: "Estado de la declaración actualizado" });
    } catch (error) {
      next(error);
    }
  },

  changeDatePayment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { fecha } = req.body;
      await statementsModel.changeDatePayment(id, fecha);
      res.json({ message: "Fecha de pago actualizada" });
    } catch (error) {
      next(error);
    }
  },
};

export default statementsController;
