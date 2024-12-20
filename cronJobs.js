import cron from "node-cron";
import { pool } from "./db/db.js";
import { transporter } from "./mailer.js";

// Función para obtener emails de empresas
const getCompanyEmails = async () => {
  try {
    const [rows] = await pool.query(
      "SELECT email_contacto FROM empresas WHERE email_contacto IS NOT NULL"
    );
    return rows.map((row) => row.email_contacto);
  } catch (error) {
    console.error("Error obteniendo correos de empresas:", error);
    return [];
  }
};

// Función para enviar correo
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: "uesevirosario@gmail.com",
    to: to,
    subject: subject,
    text: text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error al enviar correo:", error);
    } else {
      console.log("Correo enviado: " + info.response);
    }
  });
};

// Mensaje para el día 15
const mensajeDia15 = `
Sr. Empresario, recuerde subir la DDJJ del mes, en caso de haberlo hecho desestime él mismo. Saludos cordiales.
`;

// Mensaje para el día 27
const mensajeDia27 = `
Sr. Empresario recuerde que tiene tiempo hasta el último día del mes para abonar la DDJJ a fin de evitar el cobro de intereses. En caso de haberla abonado desestime él mismo. Saludos cordiales.
`;

// Programar envío para el día 15 de cada mes a las 9:00 AM
cron.schedule("0 9 15 * *", async () => {
  console.log("Ejecutando envío de correos del día 15...");
  try {
    const correos = await getCompanyEmails();
    
    if (correos.length === 0) {
      console.log("No hay correos de empresas para enviar.");
      return;
    }

    // Enviar correo a cada empresa
    correos.forEach((correo) => {
      sendEmail(correo, "Notificación Mensual - Día 15", mensajeDia15);
    });
  } catch (error) {
    console.error("Error en el envío de correos del día 15:", error);
  }
});

// Programar envío para el día 27 de cada mes a las 9:00 AM
cron.schedule("0 9 27 * *", async () => {
  console.log("Ejecutando envío de correos del día 27...");
  try {
    const correos = await getCompanyEmails();

    if (correos.length === 0) {
      console.log("No hay correos de empresas para enviar.");
      return;
    }

    // Enviar correo a cada empresa
    correos.forEach((correo) => {
      sendEmail(correo, "Notificación Mensual - Día 27", mensajeDia27);
    });
  } catch (error) {
    console.error("Error en el envío de correos del día 27:", error);
  }
});

// Mantener la función existente de actualización de salarios
const checkAndUpdateSalaries = async () => {
  const now = new Date();
  const query =
    "UPDATE categorias SET sueldo_basico = sueldo_futuro, sueldo_futuro = NULL, fecha_vigencia = NULL WHERE fecha_vigencia <= ? AND sueldo_futuro IS NOT NULL";

  await pool.query(query, [now]);
};

// Mantener el job de actualización de salarios
cron.schedule("0 0 * * *", checkAndUpdateSalaries);
