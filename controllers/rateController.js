import rateModel from "../models/rateModel.js";

const rateController = {
  getAll: async (req, res, next) => {
    try {
      const tasas = await rateModel.getAll();
      res.json(tasas);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { percentage } = req.body;
      const { id } = req.params;
      await rateModel.update(id, percentage);
      res.json({ message: "Tasa actualizada" });
    } catch (error) {
      next(error);
    }
  },
};

export default rateController;
