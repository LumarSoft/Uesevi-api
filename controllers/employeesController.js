import employeesModel from "../models/employeesModel.js";

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
      console.log(req.body)
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
};

export default employeesController;
