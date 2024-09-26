import oldStatementsModel from "../models/oldStatementsModel.js";

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

const oldStatementsController = {
  getAll: async (req, res, next) => {
    try {
      const statements = await oldStatementsModel.getAll();

      // Manejo de casos vacíos
      if (!statements || statements.length === 0) {
        return handleError(
          res,
          null,
          404,
          "No se encontraron declaraciones antiguas"
        );
      }

      response(
        res,
        statements,
        200,
        "Declaraciones antiguas obtenidas con éxito"
      );
    } catch (error) {
      handleError(res, error);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const statement = await oldStatementsModel.getOne(id);

      // Verificación de declaración encontrada
      if (!statement) {
        return handleError(res, null, 404, "Declaración no encontrada");
      }

      response(res, statement, 200, "Declaración obtenida con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getInfo: async (req, res, next) => {
    try {
      const { idCompany, idStatement } = req.params;
      const info = await oldStatementsModel.getInfo(idCompany, idStatement);

      // Verificación de información encontrada
      if (!info) {
        return handleError(
          res,
          null,
          404,
          "Información de la declaración no encontrada"
        );
      }

      response(
        res,
        info,
        200,
        "Información de la declaración obtenida con éxito"
      );
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default oldStatementsController;
