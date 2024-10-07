import loginModel from "../models/loginModel.js";

// Función de manejo de errores
const handleError = (
  res,
  error,
  statusCode = 500,
  defaultMessage = "Error interno del servidor"
) => {
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

const loginController = {
  getUser: async (req, res, next) => {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return handleError(res, null, 400, "Email y contraseña son requeridos");
    }

    try {
      const result = await loginModel.getUser(email, password);
      if (result.error) {
        return handleError(res, null, 401, result.message);
      }
      response(res, result, 200, "Usuario autenticado con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  loginEmpresa: async (req, res, next) => {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return handleError(res, null, 400, "Email y contraseña son requeridos");
    }

    try {
      const result = await loginModel.loginEmpresa(email, password);
      console.log(result);
      if (result.error) {
        return handleError(res, null, 401, result.message);
      }
      response(res, result, 200, "Empresa autenticada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default loginController;
