import cron from "node-cron";
import { pool } from "./db/db.js";
import { transporter } from "./mailer.js";
import categoryModel from "./models/categoryModel.js";

// ============================================================================
// INTERRUPTOR DE TAREAS PROGRAMADAS
//
// Poner CRONS_HABILITADOS=false en el .env para que esta instancia NO registre
// ningún cron. Es obligatorio en cualquier instancia que no sea producción:
// el job del día 15 le manda un mail REAL a todas las empresas de la base, así
// que dos instancias levantadas = mail duplicado a cada empresa.
//
// Por defecto está HABILITADO: si la variable no existe, se comporta como
// siempre y producción no necesita ningún cambio.
// ============================================================================
const CRONS_HABILITADOS =
  String(process.env.CRONS_HABILITADOS ?? "true").toLowerCase() !== "false";

if (!CRONS_HABILITADOS) {
  console.log(
    "⏸  Tareas programadas DESACTIVADAS en esta instancia (CRONS_HABILITADOS=false). " +
      "No se envían mails ni se promueven sueldos/presentismos."
  );
}

/** Registra un cron sólo si esta instancia tiene las tareas habilitadas. */
const programar = (expresion, tarea) => {
  if (!CRONS_HABILITADOS) return;
  cron.schedule(expresion, tarea);
};

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

// Mensaje para el día 27 - COMENTADO: Notificación deshabilitada
// const mensajeDia27 = `
// Sr. Empresario recuerde que tiene tiempo hasta el último día del mes para abonar la DDJJ a fin de evitar el cobro de intereses. En caso de haberla abonado desestime él mismo. Saludos cordiales.
// `;

// Programar envío para el día 15 de cada mes a las 9:00 AM
programar("0 9 15 * *", async () => {
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

// COMENTADO: Programar envío para el día 27 de cada mes a las 9:00 AM - NOTIFICACIÓN DESHABILITADA
// cron.schedule("0 9 27 * *", async () => {
//   console.log("Ejecutando envío de correos del día 27...");
//   try {
//     const correos = await getCompanyEmails();

//     if (correos.length === 0) {
//       console.log("No hay correos de empresas para enviar.");
//       return;
//     }

//     // Enviar correo a cada empresa
//     correos.forEach((correo) => {
//       sendEmail(correo, "Notificación Mensual - Día 27", mensajeDia27);
//     });
//   } catch (error) {
//     console.error("Error en el envío de correos del día 27:", error);
//   }
// });

// Mantener la función existente de actualización de salarios
// Promueve los valores programados de las categorías cuya vigencia ya llegó:
// sueldo_futuro -> sueldo_basico  y  presentismo_futuro -> presentismo.
//
// ⚠️ Delega en categoryModel.updateNow(). Antes esta función tenía su PROPIA
// copia del UPDATE, que sólo contemplaba el sueldo: al agregar el presentismo
// programado quedó desincronizada y el presentismo nunca se habría promovido.
// Una sola implementación, en el modelo — no volver a duplicar el SQL acá.
const checkAndUpdateSalaries = async () => {
  try {
    const r = await categoryModel.updateNow();
    if (r.affectedRows > 0) {
      console.log(
        `Categorías actualizadas: ${r.sueldosActualizados} sueldo(s) básico(s), ` +
          `${r.presentismosActualizados} presentismo(s).`
      );
    }
  } catch (error) {
    console.error("Error al promover valores programados de categorías:", error);
  }
};

// Job diario de actualización de sueldos básicos y presentismos programados.
programar("0 0 * * *", checkAndUpdateSalaries);
