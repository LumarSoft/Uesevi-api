import rateModel from "../models/rateModel.js";

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
    status: "error", // Cambiado para ser consistente con el estándar
    statusCode,
    message: defaultMessage,
    error: error?.message || null,
  });
};

// Función de respuesta estándar
const response = (res, data, statusCode = 200, message = "Éxito") => {
  res.status(statusCode).json({
    ok: true,
    status: "success", // Cambiado para ser consistente con el estándar
    statusCode,
    message,
    data, // Se devuelve directamente el data sin anidarlo
  });
};

const rateController = {
  getAll: async (req, res, next) => {
    try {
      const tasas = await rateModel.getAll();

      // Manejo de casos vacíos
      if (!tasas || tasas.length === 0) {
        return handleError(res, null, 404, "No se encontraron tasas");
      }

      response(res, tasas, 200, "Tasas obtenidas con éxito"); // Aquí ahora devolvemos tasas directamente
    } catch (error) {
      handleError(res, error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { percentage } = req.body;
      const { id } = req.params;
      console.log("percentage", percentage);

      // Validación de entrada. Percetage llega en forma de string pero en la base de datos es tipo decimal
      if (!percentage) {
        return handleError(res, null, 400, "Porcentaje inválido");
      }

      const updatedRate = await rateModel.update(id, percentage);

      // Verificación si la tasa fue actualizada
      if (!updatedRate) {
        return handleError(res, null, 404, "Tasa no encontrada");
      }

      response(res, updatedRate, 200, "Tasa actualizada con éxito"); // Se ajusta para devolver el updatedRate
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default rateController;
