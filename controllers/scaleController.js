import scaleModel from "../models/scaleModel.js";

const scaleController = {
  getAll: async (req, res, next) => {
    try {
      const escalas = await scaleModel.getAll();
      res.json(escalas);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      await scaleModel.delete(id);
      res.json({ message: "Archivo eliminado" });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const result = await scaleModel.update(id, name);
      if (result.affectedRows > 0) {
        res.json({
          message: "Archivo actualizado",
          updatedEscala: req.body,
        });
      } else {
        res.status(404).json({ message: "Archivo no encontrado" });
      }
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, id } = req.body;
      const pdf = req.files["pdf"] ? req.files["pdf"][0].path : null;

      if (!name || !pdf) {
        const error = new Error("Faltan campos obligatorios");
        error.httpStatus = 400;
        throw error;
      }

      const result = await scaleModel.create({ name, pdf, id });

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
export default scaleController;
