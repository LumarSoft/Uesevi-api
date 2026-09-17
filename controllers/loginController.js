import loginModel from "../models/loginModel.js";
import { transporter } from "../mailer.js";

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

const resetCodes = new Map();

const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Función para enviar correo con código de verificación
const sendResetCodeEmail = async (email, resetCode) => {
  const mailOptions = {
    from: '"UESEVI - Rosario" <uesevirosario@gmail.com>',
    to: email,
    subject: "Código de verificación para cambio de contraseña",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #3b82f6;">UESEVI</h1>
        </div>
        <h2 style="color: #333;">Cambio de contraseña</h2>
        <p>Hemos recibido una solicitud para cambiar la contraseña de su cuenta. Utilice el siguiente código de verificación para continuar con el proceso:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
          ${resetCode}
        </div>
        <p>Este código es válido por 10 minutos. Si usted no solicitó este cambio, puede ignorar este mensaje.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">
          Este es un mensaje automático, por favor no responda a este correo.
        </p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
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
      if (result.error) {
        return handleError(res, null, 401, result.message);
      }
      response(res, result, 200, "Empresa autenticada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  requestPasswordReset: async (req, res, next) => {
    const { email } = req.body;

    // Validar campo requerido
    if (!email) {
      return handleError(res, null, 400, "Email es requerido");
    }

    try {
      // Verificar que el email existe en la base de datos
      const exists = await loginModel.checkEmpresaEmail(email);
      if (!exists) {
        return handleError(res, null, 404, "No existe una cuenta con este correo electrónico");
      }

      // Generar código aleatorio
      const resetCode = generateResetCode();
      
      // Guardar código en el almacén temporal (expira en 10 minutos)
      resetCodes.set(email, {
        code: resetCode,
        expiry: Date.now() + 10 * 60 * 1000 // 10 minutos
      });

      // Enviar el código por email
      await sendResetCodeEmail(email, resetCode);

      response(
        res, 
        {}, // No enviar el código en la respuesta en producción
        200, 
        "Código de verificación enviado con éxito a su correo electrónico"
      );
    } catch (error) {
      handleError(res, error);
    }
  },

  verifyResetCode: async (req, res, next) => {
    const { email, code } = req.body;

    // Validar campos requeridos
    if (!email || !code) {
      return handleError(res, null, 400, "Email y código son requeridos");
    }

    try {
      // Verificar que existe un código para este email
      const resetInfo = resetCodes.get(email);
      if (!resetInfo) {
        return handleError(res, null, 404, "No se ha solicitado cambio de contraseña para este correo");
      }

      // Verificar que el código no ha expirado
      if (resetInfo.expiry < Date.now()) {
        resetCodes.delete(email); // Limpiar código expirado
        return handleError(res, null, 400, "El código ha expirado. Solicite uno nuevo");
      }

      // Verificar que el código coincide
      if (resetInfo.code !== code) {
        return handleError(res, null, 400, "Código incorrecto");
      }

      // Código verificado con éxito
      response(res, {}, 200, "Código verificado correctamente");
    } catch (error) {
      handleError(res, error);
    }
  },

  resetPassword: async (req, res, next) => {
    const { email, code, newPassword } = req.body;

    // Validar campos requeridos
    if (!email || !code || !newPassword) {
      return handleError(res, null, 400, "Email, código y nueva contraseña son requeridos");
    }

    // Validar longitud mínima de contraseña
    if (newPassword.length < 8) {
      return handleError(res, null, 400, "La contraseña debe tener al menos 8 caracteres");
    }

    try {
      // Verificar que existe un código para este email
      const resetInfo = resetCodes.get(email);
      if (!resetInfo) {
        return handleError(res, null, 404, "No se ha solicitado cambio de contraseña para este correo o el código ha expirado");
      }

      // Verificar que el código no ha expirado
      if (resetInfo.expiry < Date.now()) {
        resetCodes.delete(email); // Limpiar código expirado
        return handleError(res, null, 400, "El código ha expirado. Solicite uno nuevo");
      }

      // Verificar que el código coincide
      if (resetInfo.code !== code) {
        return handleError(res, null, 400, "Código incorrecto");
      }

      // Cambiar la contraseña
      const result = await loginModel.updateEmpresaPassword(email, newPassword);
      if (!result) {
        return handleError(res, null, 500, "Error al actualizar la contraseña");
      }

      // Eliminar el código de restablecimiento después de usarlo
      resetCodes.delete(email);

      response(res, {}, 200, "Contraseña actualizada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default loginController;
