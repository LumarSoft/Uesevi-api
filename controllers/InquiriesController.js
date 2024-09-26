import inquiriesModel from "../models/inquiriesModel.js";

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

const inquiriesController = {
  getAllInquiries: async (req, res, next) => {
    try {
      const inquiries = await inquiriesModel.getAllInquiries();
      response(res, inquiries, 200, "Consultas obtenidas con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  addInquiry: async (req, res, next) => {
    try {
      const { name, email, message, phone } = req.body;
      
      // Validar datos de entrada
      if (!name || !email || !message) {
        return handleError(res, null, 400, "Faltan campos requeridos");
      }

      const result = await inquiriesModel.addInquiry(name, email, message, phone);
      response(res, null, 201, "Consulta agregada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default inquiriesController;
