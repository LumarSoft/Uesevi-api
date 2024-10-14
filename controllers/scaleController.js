import scaleModel from "../models/scaleModel.js";

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
    data: {
      status: "error",
      statusCode,
      message: defaultMessage,
      error: error?.message || null,
    },
  });
};

// Función de respuesta estándar
const response = (
  res,
  data,
  statusCode = 200,
  message = "Datos obtenidos con éxito"
) => {
  res.status(statusCode).json({
    ok: true,
    status: "success",
    statusCode,
    message,
    data,
  });
};

const scaleController = {
  getAll: async (req, res, next) => {
    try {
      const escalas = await scaleModel.getAll();
      response(res, escalas, 200, "Escalas obtenidas con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getAllClient: async (req, res, next) => {
    try {
      const escalas = await scaleModel.getAllClient();
      response(res, escalas, 200, "Escalas para cliente obtenidas con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await scaleModel.delete(id);
      if (result.affectedRows > 0) {
        response(res, null, 200, "Archivo eliminado con éxito");
      } else {
        response(res, null, 404, "Archivo no encontrado");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      // Validación de entrada
      if (!name) {
        return handleError(res, null, 400, "El campo 'name' es obligatorio");
      }

      const result = await scaleModel.update(id, name);
      if (result.affectedRows > 0) {
        response(
          res,
          { updatedEscala: req.body },
          200,
          "Archivo actualizado con éxito"
        );
      } else {
        response(res, null, 404, "Archivo no encontrado");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, id } = req.body;
      const pdf = req.files["pdf"] ? req.files["pdf"][0].originalname : null;

      // Validación de entrada
      if (!name || !pdf) {
        return handleError(res, null, 400, "Faltan campos obligatorios");
      }

      const result = await scaleModel.create({ name, pdf, id });
      response(res, result, 201, "Archivo creado con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default scaleController;
