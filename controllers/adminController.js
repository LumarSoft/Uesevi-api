import adminModel from "../models/adminInfoModel.js";
import bcrypt from "bcrypt";

const AdminController = {
  getAll: async (req, res, next) => {
    try {
      const admins = await adminModel.getAll();
      res.json(admins);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const adminData = req.body;
      const result = await adminModel.update(id, adminData);
      if (result.affectedRows > 0) {
        res.json({ message: "Usuario actualizado" });
      } else {
        res.status(404).json({ message: "Usuario no encontrado" });
      }
    } catch (error) {
      next(error);
    }
  },

  addAdmin: async (req, res, next) => {
    console.log(req.body);
    try {
      const adminData = req.body;
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
      adminData.password = hashedPassword;

      const result = await adminModel.addAdmin(adminData);
      if (result.affectedRows > 0) {
        res.status(201).json({ message: "Usuario creado", newUser: adminData });
      } else {
        res.status(400).json({ message: "Error al crear usuario" });
      }
    } catch (error) {
      next(error);
    }
  },
};

export default AdminController;
