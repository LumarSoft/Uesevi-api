import categoryModel from "../models/categoryModel.js";

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

const categoryController = {
  getAll: async (req, res, next) => {
    try {
      const categories = await categoryModel.getAll();
      response(res, categories, 200, "Categorías obtenidas con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  addCategory: async (req, res, next) => {
    try {
      const { name, salary } = req.body;

      const result = await categoryModel.addCategory(name, salary);
      response(res, result, 201, "Categoría agregada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      const { id } = req.params;

      const result = await categoryModel.deleteCategory(id);
      if (result.affectedRows > 0) {
        response(res, null, 200, "Categoría eliminada con éxito");
      } else {
        handleError(res, null, 404, "Categoría no encontrada");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  editCategory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, salary } = req.body;

      const result = await categoryModel.editCategory(id, name, salary);
      if (result.affectedRows > 0) {
        response(res, null, 200, "Categoría editada con éxito");
      } else {
        handleError(res, null, 404, "Categoría no encontrada");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  futureSalary: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { futureSalary, dateChange } = req.body;

      const result = await categoryModel.futureSalary(
        id,
        futureSalary,
        dateChange
      );
      if (result.affectedRows > 0) {
        response(res, null, 200, "Salario futuro actualizado con éxito");
      } else {
        handleError(res, null, 404, "Categoría no encontrada");
      }
    } catch (error) {
      handleError(res, error);
    }
  },

  updateNow: async (req, res, next) => {
    try {
      const result = await categoryModel.updateNow();
      response(res, result, 200, "Salarios actualizados con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getGeneral: async (req, res, next) => {
    try {
      const result = await categoryModel.getGeneral();
      response(res, result, 200, "Datos generales obtenidos con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default categoryController;
