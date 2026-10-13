import accountModel from "../models/accountModel.js";
import loginModel from "../models/loginModel.js";
import { transporter } from "../mailer.js";
import {
  EMAIL_DUPLICADO_MESSAGE,
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  normalizeEmail,
} from "../utils/accountUtils.js";

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

// Aviso al email anterior cuando cambia el email de acceso, para que la
// empresa se entere si no fue ella. No bloquea la respuesta.
const sendEmailChangedNotice = async (previousEmail, newEmail) =>
  transporter.sendMail({
    from: '"UESEVI - Rosario" <uesevirosario@gmail.com>',
    to: previousEmail,
    subject: "Se cambió el email de acceso de su cuenta UESEVI",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Cambio de email de acceso</h2>
        <p>El email para ingresar al sistema de UESEVI se cambió a <strong>${newEmail}</strong>.</p>
        <p>Si usted no realizó este cambio, comuníquese con UESEVI.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">Este es un mensaje automático, por favor no responda a este correo.</p>
      </div>`,
  });

// Factory con dependencias inyectables (mismo patrón que createOwnershipGuards)
// para poder testear sin MySQL ni SMTP.
export const createAccountController = ({
  model = accountModel,
  comparePassword = loginModel.comparePassword,
  hashPassword = loginModel.hashPassword,
  generateToken = loginModel.generateToken,
  notifyEmailChanged = sendEmailChangedNotice,
} = {}) => ({
  // GET /account
  get: async (req, res) => {
    try {
      const account = await model.getAccount(req.user.id);
      if (!account) return handleError(res, null, 404, "Cuenta no encontrada");
      response(res, account, 200, "Cuenta obtenida con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  // PUT /account/email  { newEmail, currentPassword }
  updateEmail: async (req, res) => {
    const newEmail = normalizeEmail(req.body?.newEmail);
    const currentPassword = req.body?.currentPassword;

    if (!newEmail || !currentPassword) {
      return handleError(res, null, 400, "El nuevo email y la contraseña actual son requeridos");
    }
    if (!isValidEmail(newEmail)) {
      return handleError(res, null, 400, "El nuevo email no es un correo electrónico válido");
    }

    try {
      const user = await model.getCredentials(req.user.id);
      if (!user) return handleError(res, null, 404, "Cuenta no encontrada");

      if (!(await comparePassword(currentPassword, user.password))) {
        return handleError(res, null, 400, "La contraseña actual es incorrecta");
      }

      if (normalizeEmail(user.email) === newEmail) {
        return handleError(res, null, 400, "El nuevo email es igual al actual");
      }

      if (await model.isEmailTaken(newEmail, user.id)) {
        return handleError(res, null, 409, EMAIL_DUPLICADO_MESSAGE);
      }

      const previousEmail = user.email;
      await model.updateEmail(user.id, newEmail);

      try {
        await notifyEmailChanged(previousEmail, newEmail);
      } catch (mailError) {
        console.error("No se pudo avisar el cambio de email:", mailError?.message);
      }

      // El JWT lleva el email: se emite uno nuevo para que la sesión siga
      // consistente sin tener que volver a loguearse.
      const token = generateToken(
        { id: user.id, email: newEmail, rol: user.rol },
        req.user.idEmpresa
      );

      response(res, { email: newEmail, token }, 200, "Email de acceso actualizado con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  // PUT /account/password  { currentPassword, newPassword }
  updatePassword: async (req, res) => {
    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;

    if (!currentPassword || !newPassword) {
      return handleError(res, null, 400, "La contraseña actual y la nueva son requeridas");
    }
    if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
      return handleError(
        res,
        null,
        400,
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
      );
    }
    if (newPassword === currentPassword) {
      return handleError(res, null, 400, "La nueva contraseña debe ser distinta de la actual");
    }

    try {
      const user = await model.getCredentials(req.user.id);
      if (!user) return handleError(res, null, 404, "Cuenta no encontrada");

      if (!(await comparePassword(currentPassword, user.password))) {
        return handleError(res, null, 400, "La contraseña actual es incorrecta");
      }

      await model.updatePassword(user.id, await hashPassword(newPassword));
      response(res, {}, 200, "Contraseña actualizada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
});

export default createAccountController();
