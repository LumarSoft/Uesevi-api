import employeesModel from "../models/employeesModel.js";
import { pool } from "../db/db.js";

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

      // Validación de CUIL duplicados
      const cuils = new Set();
      for (const employee of employees) {
        const cuil = String(employee.cuil).trim(); // Normalizar el CUIL

        if (cuils.has(cuil)) {
          console.log(`CUIL duplicado encontrado: ${cuil}`); // Log para verificar el duplicado
          return handleError(
            res,
            null,
            400,
            `Error: CUIL duplicado encontrado: ${cuil}` // Asegurarnos de enviar el CUIL en conflicto
          );
        }
        cuils.add(cuil);
      }

      // Proceder con la importación si no hay duplicados
      const result = await employeesModel.importEmployees(employees, companyId, month, year);
      response(res, result, 201, "Empleados importados con éxito");
    } catch (error) {
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
        return response(res, [], 200, "No se encontró historial para este empleado");
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
        [usuarioResult] = await pool.query(usuarioQuery, [empleadoResult[0].usuario_id]);
      }
      
      const debugData = {
        empleadoId: empleadoId,
        empleado: empleadoResult,
        contratos: contratosResult,
        usuario: usuarioResult,
        totalContratos: contratosResult.length
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
