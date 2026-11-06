import salaryCompositionModel from "../models/salaryCompositionModel.js";
import { validateComposition } from "../utils/salaryComposition.js";

// Función de manejo de errores
const handleError = (
  res,
  error,
  statusCode = 500,
  defaultMessage = "Error interno del servidor"
) => {
  if (statusCode >= 500) console.error("Error en el controlador:", error);
  res.status(statusCode).json({
    ok: false,
    status: "error",
    statusCode,
    message: defaultMessage,
    error: error?.message || null,
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

const esDuplicado = (error) => error?.code === "ER_DUP_ENTRY";
const MENSAJE_DUPLICADO =
  "Ya existe una composición cargada para ese mes y categoría";

const salaryCompositionController = {
  // GET /salary-composition/public — sin token, lo consume la home.
  getPublic: async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 12, 36);
      const data = await salaryCompositionModel.getPublic(limit);
      response(res, data, 200, "Composición salarial obtenida con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getAll: async (req, res) => {
    try {
      const data = await salaryCompositionModel.getAll();
      response(res, data, 200, "Composiciones obtenidas con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getById: async (req, res) => {
    try {
      const data = await salaryCompositionModel.getById(req.params.id);
      if (!data) return handleError(res, null, 404, "Composición no encontrada");
      response(res, data, 200, "Composición obtenida con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  create: async (req, res) => {
    const { data, error } = validateComposition(req.body);
    if (error) return handleError(res, null, 400, error);

    try {
      const creada = await salaryCompositionModel.create(data);
      response(res, creada, 201, "Composición creada con éxito");
    } catch (err) {
      if (esDuplicado(err)) return handleError(res, null, 409, MENSAJE_DUPLICADO);
      handleError(res, err);
    }
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { data, error } = validateComposition(req.body);
    if (error) return handleError(res, null, 400, error);

    try {
      const result = await salaryCompositionModel.update(id, data);
      if (!result.affectedRows) {
        return handleError(res, null, 404, "Composición no encontrada");
      }
      const actualizada = await salaryCompositionModel.getById(id);
      response(res, actualizada, 200, "Composición actualizada con éxito");
    } catch (err) {
      if (esDuplicado(err)) return handleError(res, null, 409, MENSAJE_DUPLICADO);
      handleError(res, err);
    }
  },

  delete: async (req, res) => {
    try {
      const result = await salaryCompositionModel.delete(req.params.id);
      if (!result.affectedRows) {
        return handleError(res, null, 404, "Composición no encontrada");
      }
      response(res, null, 200, "Composición eliminada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default salaryCompositionController;
