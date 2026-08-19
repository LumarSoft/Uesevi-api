import statementsModel from "../models/statementsModel.js";
import { pool } from "../db/db.js";
import {
  validateEmployees,
  buildErrorMessage,
} from "../utils/employeeImportValidation.js";

// Función de manejo de errores
const handleError = (
  res,
  error,
  statusCode = 500,
  defaultMessage = "Error interno del servidor"
) => {
  console.error("Error en el controlador:", error);

  // El mensaje va en el primer nivel: el front lee `result.message`. Antes
  // quedaba anidado dentro de `data` y el usuario veía "Error desconocido".
  const message = error?.message || defaultMessage;

  res.status(statusCode).json({
    ok: false,
    status: "error",
    statusCode,
    message,
    error: error?.message || null,
    data: {
      status: "error",
      statusCode,
      message,
      error: error?.message || null,
    },
  });
};

// Respuesta de validación: devuelve el detalle fila por fila del Excel.
const validationError = (res, errors, statusCode = 422) => {
  const message = buildErrorMessage(errors);
  console.warn("Validación de rectificación fallida:", errors);

  res.status(statusCode).json({
    ok: false,
    status: "validation_error",
    statusCode,
    message,
    errors,
    data: null,
  });
};

// Categorías vigentes del sistema, para validar la columna "Categoría".
const getValidCategories = async () => {
  const [rows] = await pool.query("SELECT nombre FROM categorias");
  return rows.map((row) => row.nombre);
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

  getStatementsByCompanyFiltered: async (req, res, next) => {
    try {
      const { idCompany } = req.params;
      const statements = await statementsModel.getStatementsByCompany(
        idCompany
      );
      response(
        res,
        statements,
        200,
        "Declaraciones filtradas obtenidas con éxito"
      );
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

      if (!companyId || !statementId) {
        return handleError(
          res,
          null,
          400,
          "Faltan datos para rectificar la declaración: empresa o declaración de origen."
        );
      }

      // Mismo criterio que la importación: validamos el archivo completo antes
      // de abrir la transacción y devolvemos los errores fila por fila.
      const validCategories = await getValidCategories();
      const { errors, employees: validatedEmployees } = validateEmployees(
        employees,
        { validCategories }
      );

      if (errors.length > 0) {
        return validationError(res, errors);
      }

      const result = await statementsModel.rectify(
        validatedEmployees,
        companyId,
        statementId,
        year,
        month
      );

      if (result?.status !== "OK") {
        return handleError(
          res,
          null,
          500,
          "No se pudo rectificar la declaración jurada. No se guardó ningún dato, volvé a intentarlo."
        );
      }

      response(
        res,
        result,
        201,
        `Declaración rectificada con éxito (${result.empleados} empleados).`
      );
    } catch (error) {
      // La transacción ya hizo rollback: avisamos que no quedó nada guardado.
      handleError(
        res,
        null,
        500,
        `No se pudo rectificar la declaración jurada y no se guardó ningún dato. Detalle: ${
          error?.message || "error inesperado en el servidor"
        }`
      );
      console.error("Error al rectificar la declaración:", error);
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
