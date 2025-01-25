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
      const { partial_payment } = req.body;

      // Validación de entrada
      if (!state) {
        return handleError(res, null, 400, "El campo 'state' es obligatorio");
      }

      const result = await statementsModel.changeState(
        id,
        state,
        partial_payment
      );

      console.log(result);

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

  getDebtorCompanies: async (req, res, next) => {
    console.log("hll");
    try {
      const debtorCompanies = await statementsModel.getDebtorCompanies();
      if (!debtorCompanies || debtorCompanies.length === 0) {
        return response(res, [], 200, "No hay empresas deudoras");
      }
      response(
        res,
        debtorCompanies,
        200,
        "Empresas deudoras obtenidas con éxito"
      );
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

  changeExpiration: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { expiration } = req.body;

      const result = await statementsModel.changeExpiration(id, expiration);
      response(
        res,
        result,
        200,
        "Fecha de vencimiento de la declaración actualizada con éxito"
      );
    } catch (error) {
      handleError(res, error);
    }
  },

  deleteOne: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await statementsModel.deleteOne(id);
      console.log(result);
      response(res, null, 200, "Declaración eliminada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getSalaries: async (req, res, next) => {
    const { idEmployee } = req.params;
    try {
      const salaries = await statementsModel.getSalaries(idEmployee);
      response(res, salaries, 200, "Salarios obtenidos con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getLastDeclaration: async (req, res, next) => {
    const { idCompany } = req.params;
    try {
      const lastDeclaration = await statementsModel.getLastDeclaration(
        idCompany
      );
      response(
        res,
        lastDeclaration,
        200,
        "Última declaración obtenida con éxito"
      );
    } catch (error) {
      handleError(res, error);
    }
  },

  getMissingStatements: async (req, res, next) => {
    try {
      const { idCompany } = req.params;
      const missingStatements = await statementsModel.getMissingStatements(
        idCompany
      );
      response(
        res,
        missingStatements,
        200,
        "Declaraciones faltantes obtenidas con éxito"
      );
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default statementsController;
