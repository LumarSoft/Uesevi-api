import contratosModel from "../models/contractsModel.js";

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

const contractsController = {
  getAll: async (req, res, next) => {
    try {
      const contracts = await contratosModel.getAll();
      response(res, contracts, 200, "Contratos obtenidos con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  // Agregar otros métodos como crear, editar y eliminar contratos si es necesario
  // Ejemplo de método para crear contrato
  create: async (req, res, next) => {
    try {
      const { field1, field2 } = req.body; // Cambia esto por los campos reales
      const result = await contratosModel.create(field1, field2); // Asegúrate de que el modelo tenga el método create
      response(res, result, 201, "Contrato creado con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  // Ejemplo de método para eliminar contrato
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await contratosModel.delete(id); // Asegúrate de que el modelo tenga el método delete
      if (result.affectedRows > 0) {
        response(res, null, 200, "Contrato eliminado con éxito");
      } else {
        handleError(res, null, 404, "Contrato no encontrado");
      }
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default contractsController;
