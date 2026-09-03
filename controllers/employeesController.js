import employeesModel from "../models/employeesModel.js";
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
  // Determina el mensaje final para enviar
  const message = error?.message || defaultMessage;

  console.error("Error en el controlador:", error || message); // Log para depuración

  res.status(statusCode).json({
    ok: false,
    status: "error",
    statusCode,
    message,
    error: error?.message || null, // Detalles adicionales del error, si están disponibles
  });
};

// Respuesta de validación: además del mensaje devuelve el detalle fila por fila
// para que el front pueda listar exactamente qué corregir en el Excel.
const validationError = (res, errors, statusCode = 422) => {
  const message = buildErrorMessage(errors);
  console.warn("Validación de importación fallida:", errors);

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

const employeesController = {
  getAll: async (req, res, next) => {
    try {
      const employees = await employeesModel.getAll();
      response(res, employees, 200, "Empleados obtenidos con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getByCompany: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employees = await employeesModel.getByEmpresa(id);
      response(
        res,
        employees,
        200,
        "Empleados por empresa obtenidos con éxito"
      );
    } catch (error) {
      handleError(res, error);
    }
  },

  getHistoricByCompany: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employees = await employeesModel.getHistoricByEmpresa(id);
      response(
        res,
        employees,
        200,
        "Empleados históricos por empresa obtenidos con éxito"
      );
    } catch (error) {
      handleError(res, error);
    }
  },

  getOldByCompany: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employees = await employeesModel.getOldByEmpresa(id);
      response(
        res,
        employees,
        200,
        "Empleados antiguos por empresa obtenidos con éxito"
      );
    } catch (error) {
      handleError(res, error);
    }
  },

  addEmployee: async (req, res, next) => {
    try {
      const {
        firstName,
        lastName,
        cuil,
        category,
        employmentStatus,
        unionAdhesion,
        email,
        companyId,
      } = req.body;
      await employeesModel.addEmployee(
        firstName,
        lastName,
        cuil,
        category,
        employmentStatus,
        unionAdhesion,
        email,
        companyId
      );
      res.json({ message: "Employee added" });
    } catch (error) {
      next(error);
    }
  },

  editEmployee: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        cuil,
        category,
        employmentStatus,
        unionMembership,
      } = req.body;
      const result = await employeesModel.editEmployee(
        id,
        firstName,
        lastName,
        cuil,
        category,
        employmentStatus,
        unionMembership
      );
      if (result.affectedRows > 0) {
        response(res, null, 200, "Empleado actualizado con éxito");
      } else {
        handleError(res, null, 404, "Empleado no encontrado");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  deleteEmployee: async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await employeesModel.deleteEmployee(id);
      if (result.affectedRows > 0) {
        response(res, null, 200, "Empleado eliminado con éxito");
      } else {
        handleError(res, null, 404, "Empleado no encontrado");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  importEmployees: async (req, res, next) => {
    try {
      const { employees, companyId, month, year } = req.body;

      if (!companyId || !month || !year) {
        return handleError(
          res,
          null,
          400,
          "Faltan datos para cargar la declaración: empresa, mes o año."
        );
      }

      // Validamos TODO el archivo antes de abrir la transacción. Antes se iba
      // directo a la base: una fila sin CUIL rompía la query, se hacía rollback
      // y el error se perdía, así que el usuario veía "cargada" una declaración
      // que nunca se guardó.
      const validCategories = await getValidCategories();
      const { errors, employees: validatedEmployees } = validateEmployees(
        employees,
        { validCategories }
      );

      if (errors.length > 0) {
        return validationError(res, errors);
      }

      const result = await employeesModel.importEmployees(
        validatedEmployees,
        companyId,
        month,
        year
      );

      // La declaración ya existía para ese período (anti doble submit).
      if (result?.status === "DUPLICATE") {
        return handleError(res, null, 409, result.message);
      }

      // Falta un período anterior sin declarar (ej. se borró una declaración
      // y quedó un mes adeudado antes del que se quiere cargar ahora).
      if (result?.status === "GAP") {
        return handleError(res, null, 409, result.message);
      }

      if (result?.status !== "OK") {
        return handleError(
          res,
          null,
          500,
          "No se pudo generar la declaración jurada. No se guardó ningún dato, volvé a intentarlo."
        );
      }

      response(
        res,
        result,
        201,
        `Declaración jurada cargada con éxito (${result.empleados} empleados).`
      );
    } catch (error) {
      // La transacción ya hizo rollback: se lo decimos explícitamente al
      // usuario junto con el detalle (los errores del modelo indican la fila).
      handleError(
        res,
        null,
        500,
        `No se pudo cargar la declaración jurada y no se guardó ningún dato. Detalle: ${
          error?.message || "error inesperado en el servidor"
        }`
      );
      console.error("Error al importar empleados:", error);
    }
  },

  // Nuevo método para búsqueda de empleados
  searchEmployees: async (req, res, next) => {
    try {
      const {
        q: searchTerm,
        company_id: companyId,
        limit = 50,
        offset = 0,
      } = req.query;

      // Validaciones
      if (!searchTerm || typeof searchTerm !== "string") {
        return handleError(
          res,
          null,
          400,
          "El parámetro de búsqueda 'q' es requerido"
        );
      }

      if (searchTerm.trim().length < 2) {
        return handleError(
          res,
          null,
          400,
          "El término de búsqueda debe tener al menos 2 caracteres"
        );
      }

      if (searchTerm.length > 100) {
        return handleError(
          res,
          null,
          400,
          "El término de búsqueda es demasiado largo"
        );
      }

      // Validar parámetros numéricos
      const parsedLimit = parseInt(limit);
      const parsedOffset = parseInt(offset);
      const parsedCompanyId = companyId ? parseInt(companyId) : null;

      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return handleError(
          res,
          null,
          400,
          "El límite debe ser un número entre 1 y 100"
        );
      }

      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return handleError(
          res,
          null,
          400,
          "El offset debe ser un número mayor o igual a 0"
        );
      }

      if (companyId && (isNaN(parsedCompanyId) || parsedCompanyId < 1)) {
        return handleError(
          res,
          null,
          400,
          "El ID de empresa debe ser un número válido"
        );
      }

      console.log(
        `🔍 Búsqueda de empleados: "${searchTerm}" (empresa: ${
          parsedCompanyId || "todas"
        })`
      );

      // Ejecutar búsqueda
      const result = await employeesModel.searchEmployees(
        searchTerm.trim(),
        parsedCompanyId,
        parsedLimit,
        parsedOffset
      );

      // Preparar respuesta con metadatos de paginación
      const responseData = {
        employees: result.employees,
        pagination: {
          total: result.total,
          limit: parsedLimit,
          offset: parsedOffset,
          totalPages: Math.ceil(result.total / parsedLimit),
          currentPage: Math.floor(parsedOffset / parsedLimit) + 1,
          hasNext: parsedOffset + parsedLimit < result.total,
          hasPrev: parsedOffset > 0,
        },
        search: {
          term: result.searchTerm,
          companyId: parsedCompanyId,
          resultsCount: result.employees.length,
        },
      };

      response(
        res,
        responseData,
        200,
        `Búsqueda completada: ${result.total} empleados encontrados`
      );
    } catch (error) {
      console.error("❌ Error en búsqueda de empleados:", error);
      handleError(res, error);
    }
  },

  // Nuevo método para obtener el historial de un empleado
  getEmployeeHistory: async (req, res, next) => {
    try {
      const { empleadoId } = req.params;
      console.log("🔍 Buscando historial para empleadoId:", empleadoId);

      const history = await employeesModel.getEmployeeHistory(empleadoId);
      console.log("📋 Historial encontrado:", history.length, "registros");

      if (history.length === 0) {
        return response(
          res,
          [],
          200,
          "No se encontró historial para este empleado"
        );
      }

      response(res, history, 200, "Historial del empleado obtenido con éxito");
    } catch (error) {
      console.error("❌ Error al obtener historial:", error);
      handleError(res, error);
    }
  },

  // Método temporal para debugging - verificar datos disponibles
  debugEmployeeData: async (req, res, next) => {
    try {
      const { empleadoId } = req.params;

      // Verificar si el empleado existe
      const empleadoQuery = `SELECT * FROM empleados WHERE id = ?`;
      const [empleadoResult] = await pool.query(empleadoQuery, [empleadoId]);

      // Verificar contratos del empleado
      const contratosQuery = `SELECT * FROM contratos WHERE empleado_id = ?`;
      const [contratosResult] = await pool.query(contratosQuery, [empleadoId]);

      // Verificar usuario asociado
      let usuarioResult = [];
      if (empleadoResult.length > 0) {
        const usuarioQuery = `SELECT * FROM usuarios WHERE id = ?`;
        [usuarioResult] = await pool.query(usuarioQuery, [
          empleadoResult[0].usuario_id,
        ]);
      }

      const debugData = {
        empleadoId: empleadoId,
        empleado: empleadoResult,
        contratos: contratosResult,
        usuario: usuarioResult,
        totalContratos: contratosResult.length,
      };

      console.log("🐛 Debug data:", debugData);
      response(res, debugData, 200, "Datos de debugging obtenidos");
    } catch (error) {
      console.error("❌ Error en debugging:", error);
      handleError(res, error);
    }
  },
};

export default employeesController;
