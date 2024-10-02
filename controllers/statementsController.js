import statementsModel from "../models/statementsModel.js";

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

const statementsController = {
  getAll: async (req, res, next) => {
    try {
      const declaraciones = await statementsModel.getAll();
      response(res, declaraciones, 200, "Declaraciones obtenidas con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const declaracion = await statementsModel.getOne(id);
      if (!declaracion) {
        return response(res, null, 404, "Declaración no encontrada");
      }
      response(res, declaracion, 200, "Declaración obtenida con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getInfo: async (req, res, next) => {
    try {
      const { idEmpresa, idDeclaracion } = req.params;
      const info = await statementsModel.getInfo(idEmpresa, idDeclaracion);
      if (!info) {
        return response(
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

  getStatementsByCompany: async (req, res, next) => {
    try {
      const { idCompany } = req.params;
      const statements = await statementsModel.getStatementsByCompany(
        idCompany
      );
      response(res, statements, 200, "Declaraciones obtenidas con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getHistory: async (req, res, next) => {
    try {
      const { idEmpresa, year, month } = req.params;
      const history = await statementsModel.getHistory(idEmpresa, year, month);
      response(
        res,
        history,
        200,
        "Historial de declaraciones obtenido con éxito"
      );
    } catch (error) {
      handleError(res, error);
    }
  },

  changeState: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { state } = req.body;

      // Validación de entrada
      if (!state) {
        return handleError(res, null, 400, "El campo 'state' es obligatorio");
      }

      const result = await statementsModel.changeState(id, state);
      if (result.affectedRows > 0) {
        response(
          res,
          null,
          200,
          "Estado de la declaración actualizado con éxito"
        );
      } else {
        response(res, null, 404, "Declaración no encontrada");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  changeDatePayment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { fecha } = req.body;

      // Validación de entrada
      if (!fecha) {
        return handleError(res, null, 400, "El campo 'fecha' es obligatorio");
      }

      const result = await statementsModel.changeDatePayment(id, fecha);

      if (result.affectedRows > 0) {
        response(
          res,
          null,
          200,
          "Fecha de pago de la declaración actualizada con éxito"
        );
      } else {
        response(res, null, 404, "Declaración no encontrada");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  rectify: async (req, res, next) => {
    try {
      const { employees, companyId, statementId, year, month } = req.body;
      const result = await statementsModel.rectify(
        employees,
        companyId,
        statementId,
        year,
        month
      );
      response(res, result, 201, "Declaración rectificada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default statementsController;
