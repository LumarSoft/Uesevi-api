import adminModel from "../models/adminInfoModel.js";
import bcrypt from "bcrypt";

// Función de manejo de errores
const handleError = (
  res,
  error,
  statusCode = 500,
  defaultMessage = "Error interno del servidor"
) => {
  console.error("Error en el controlador:", error);
  res.status(statusCode).json({
    ok: false,
    status: "error",
    statusCode,
    message: defaultMessage,
    error: error?.message || null, // Detalles del error para depuración
  });
};

// Función de respuesta estándar
const response = (res, data, statusCode = 200, message = "Éxito") => {
  res.status(statusCode).json({
    ok: true,
    status: "success",
    statusCode,
    message,
    data,
  });
};

const AdminController = {
  getAll: async (req, res, next) => {
    try {
      const admins = await adminModel.getAll();
      if (admins.length === 0) {
        return response(res, [], 200, "No se encontraron administradores");
      }
      response(res, admins, 200, "Lista de administradores obtenida con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const adminData = req.body;

      const result = await adminModel.update(id, adminData);
      if (result.affectedRows > 0) {
        response(res, null, 200, "Usuario actualizado con éxito");
      } else {
        handleError(res, null, 404, "Usuario no encontrado");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  addAdmin: async (req, res, next) => {
    try {
      const adminData = req.body;

      // Validar si se ha proporcionado una contraseña
      if (!adminData.password) {
        return handleError(res, null, 400, "La contraseña es obligatoria");
      }

      // Hashear la contraseña antes de guardarla
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
      adminData.password = hashedPassword;

      const result = await adminModel.addAdmin(adminData);
      if (result.affectedRows > 0) {
        response(res, { newUser: adminData }, 201, "Usuario creado con éxito");
      } else {
        handleError(res, null, 400, "Error al crear el usuario");
      }
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default AdminController;
