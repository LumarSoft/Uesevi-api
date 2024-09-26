import oldContractsModel from "../models/oldContractsModel.js";

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
const response = (res, data, statusCode = 200, message = "Éxito") => {
  res.status(statusCode).json({
    ok: true,
    status: "success",
    statusCode,
    message,
    data,
  });
};

const oldContractsController = {
  getAll: async (req, res, next) => {
    try {
      const contracts = await oldContractsModel.getAll();

      // Manejo de casos vacíos
      if (!contracts || contracts.length === 0) {
        return handleError(
          res,
          null,
          404,
          "No se encontraron contratos antiguos"
        );
      }

      response(res, contracts, 200, "Contratos antiguos obtenidos con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default oldContractsController;
