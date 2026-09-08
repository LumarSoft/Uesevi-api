import nodemailer from "nodemailer";
import { config } from "dotenv";

config();

// Credenciales de la casilla desde la que salen los avisos (recuperación de
// contraseña, alta de empresa, vencimientos).
//
// Se leen de api/.env (MAIL_USER / MAIL_PASS). El valor que estaba escrito acá
// quedó SOLO como respaldo para no romper los entornos que todavía no tienen
// las variables cargadas: conviene borrarlo del código una vez que MAIL_PASS
// esté en el .env del servidor.
//
// MAIL_PASS NO es la contraseña de la cuenta de Google: es una "Contraseña de
// aplicación" de 16 caracteres (https://myaccount.google.com/apppasswords).
// Cambiar la contraseña de la cuenta o desactivar la verificación en 2 pasos
// INVALIDA las contraseñas de aplicación existentes, y ahí Gmail responde
// "535-5.7.8 Username and Password not accepted".
const MAIL_USER = process.env.MAIL_USER || "uesevirosario@gmail.com";

// Google muestra la contraseña de aplicación en grupos de 4; los espacios no
// forman parte de la clave y hay que sacarlos.
const MAIL_PASS = (process.env.MAIL_PASS || "gfzhofwwfduwvrkx").replace(
  /\s/g,
  "",
);

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

// Chequeo al arrancar. Es informativo: si falla, la API sigue funcionando y lo
// único que queda sin servicio es el envío de mails.
//
// Antes esta promesa no tenía .catch(), así que un error de credenciales
// terminaba como "unhandled rejection" y escupía un stack trace enorme en cada
// arranque, sin decir qué había que corregir.
transporter
  .verify()
  .then(() => {
    console.log(`📧 Correo listo para enviar desde ${MAIL_USER}`);
  })
  .catch((error) => {
    const esAuth = error?.responseCode === 535 || error?.code === "EAUTH";

    console.warn(
      `⚠️  Envío de correos deshabilitado: ${error?.message || error}`,
    );

    if (esAuth) {
      console.warn(
        "   Gmail rechazó las credenciales. Generá una contraseña de " +
          "aplicación nueva en https://myaccount.google.com/apppasswords y " +
          "cargala en api/.env como MAIL_PASS (16 caracteres, sin espacios).",
      );
    }

    console.warn(
      "   El resto de la API funciona normalmente: solo no se envían mails " +
        "(recuperación de contraseña, avisos de alta y vencimientos).",
    );
  });
