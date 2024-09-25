import companiesModel from "../models/companiesModel.js";
import bcrypt from "bcrypt";

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

  create: async (req, res, next) => {
    try {
      const {
        cuit,
        name,
        address,
        phone,
        location,
        contactName,
        contactLastName,
        contactPhone,
        contactEmail,
        username,
        password,
      } = req.body;

      const saltRounds = 10;
      let hashedPassword = await bcrypt.hash(password, saltRounds);

      await companiesModel.create(
        cuit,
        name,
        address,
        phone,
        location,
        contactName,
        contactLastName,
        contactPhone,
        contactEmail,
        username,
        hashedPassword // Usa hashedPassword directamente
      );

      res.json({ message: "Empresa creada" });
    } catch (error) {
      next(error);
    }
  },
};

export default companiesController;
