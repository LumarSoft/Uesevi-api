import usuariosAdminModel from "../models/adminInfoModel.js";
import bcrypt from "bcrypt";

const AdminController = {
  getAll: async (req, res, next) => {
    try {
      const usuarios = await usuariosAdminModel.getAll();
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nombre, apellido, email, telefono } = req.body;
      const result = await usuariosAdminModel.update(id, {
        nombre,
        apellido,
        email,
        telefono,
      });
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
      const userData = req.body;
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      userData.password = hashedPassword;

      const result = await usuariosAdminModel.addAdmin(userData);
      if (result.affectedRows > 0) {
        res.status(201).json({ message: "Usuario creado", newUser: userData });
      } else {
        res.status(400).json({ message: "Error al crear usuario" });
      }
    } catch (error) {
      next(error);
    }
  },
};

export default AdminController;
