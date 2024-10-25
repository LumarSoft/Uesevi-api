import basicSalaryModel from "../models/basicSalaryModel.js";

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

const basicSalaryController = {
  getBasicSalary: async (req, res, next) => {
    try {
      const basicSalary = await basicSalaryModel.getBasicSalary();
      response(res, basicSalary, 200, "Salario básico obtenido con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default basicSalaryController;
