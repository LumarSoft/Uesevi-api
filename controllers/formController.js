import formularioModel from "../models/formModel.js";

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

const formController = {
  getAll: async (req, res, next) => {
    try {
      const formulario = await formularioModel.getAll();
      response(res, formulario, 200, "Lista de formularios obtenida con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  deleteRequest: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await formularioModel.deleteRequest(id);

      if (result && result.affectedRows > 0) {
        response(res, null, 200, "Formulario eliminado con éxito");
      } else {
        handleError(res, null, 404, "Formulario no encontrado");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  changeCompany: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { company } = req.body;
      const result = await formularioModel.changeCompany(company, id);
      if (result.affectedRows > 0) {
        response(
          res,
          null,
          200,
          "Empresa del formulario actualizada con éxito"
        );
      } else {
        handleError(res, null, 404, "Formulario no encontrado");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  getToComplete: async (req, res, next) => {
    try {
      const { cuil } = req.params;
      const formulario = await formularioModel.getToComplete(cuil);
      if (!formulario) {
        return handleError(res, null, 404, "Formulario no encontrado");
      }
      response(res, formulario, 200, "Formulario obtenido con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  createRequest: async (req, res, next) => {
    try {
      const data = req.body;
      const result = await formularioModel.createRequest(data);
      response(res, null, 201, "Formulario creado con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default formController;
