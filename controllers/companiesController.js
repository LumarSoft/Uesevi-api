import companiesModel from "../models/companiesModel.js";
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
    error: error.message || null, // Detalles del error para depuración
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

const companiesController = {
  getAll: async (req, res, next) => {
    try {
      const empresas = await companiesModel.getAll();
      response(res, empresas, 200, "Lista de empresas obtenida con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  changeState: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { state } = req.body;
      await companiesModel.changeState(id, state);
      response(res, null, 200, "Estado de la empresa actualizado con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await companiesModel.delete(id);
      if (result.affectedRows > 0) {
        response(res, null, 200, "Empresa eliminada con éxito");
      } else {
        handleError(res, null, 404, "Empresa no encontrada");
      }
    } catch (error) {
      handleError(res, error);
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

      // Validación de campos obligatorios
      if (
        !cuit ||
        !name ||
        !address ||
        !phone ||
        !contactName ||
        !contactLastName ||
        !username ||
        !password
      ) {
        return handleError(
          res,
          null,
          400,
          "Todos los campos son obligatorios."
        );
      }

      // Hash de la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Llamada al modelo para crear la empresa
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
        hashedPassword
      );

      // Respuesta exitosa
      response(res, null, 201, "Empresa creada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default companiesController;
