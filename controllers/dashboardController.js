import dashboardModel from "../models/dashboardModel.js";

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

const dashboardController = {
  getAll: async (req, res, next) => {
    try {
      const dashboard = await dashboardModel.getAll();

      // Verificar si hay datos disponibles
      if (dashboard.length === 0) {
        return response(
          res,
          [],
          200,
          "No se encontraron datos en el dashboard"
        );
      }

      response(res, dashboard, 200, "Datos del dashboard obtenidos con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

};

export default dashboardController;
