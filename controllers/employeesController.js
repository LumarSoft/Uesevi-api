import employeesModel from "../models/employeesModel.js";

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
      const { employees, companyId } = req.body;
      const result = await employeesModel.importEmployees(employees, companyId);
      response(res, result, 201, "Empleados importados con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default employeesController;
