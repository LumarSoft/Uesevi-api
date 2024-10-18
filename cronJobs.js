import cron from "node-cron";
import { pool } from "./db/db.js"; // Tu conexión a la base de datos
import { transporter } from "./mailer.js";

// Función existente que ya tienes para actualizar sueldos
const checkAndUpdateSalaries = async () => {
  const now = new Date();
  const query =
    "UPDATE categorias SET sueldo_basico = sueldo_futuro, sueldo_futuro = NULL, fecha_vigencia = NULL WHERE fecha_vigencia <= ? AND sueldo_futuro IS NOT NULL";

  await pool.query(query, [now]);
};

// Ejecutar el job cada día a la medianoche
cron.schedule("0 0 * * *", checkAndUpdateSalaries);

// ------------------------------------------------------------------------ ENVIAR AVISOS CADA 2 MINUTOS ------------------------------------------------------------------------

// // Función para obtener correos de la base de datos
// const getEmailsFromDatabase = async () => {
//   try {
//     const [rows] = await pool.query(
//       "SELECT email FROM usuarios WHERE activo = 1"
//     );
//     return rows.map((row) => row.email); // Devolver solo los correos electrónicos
//   } catch (error) {
//     console.error("Error obteniendo correos:", error);
//     return [];
//   }
// };

// // Función para enviar correo
// const sendEmail = (to, subject, text) => {
//   const mailOptions = {
//     from: "uesevirosario@gmail.com",
//     to: to, // Lista de destinatarios
//     subject: subject, // Asunto del correo
//     text: text, // Cuerpo del correo
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.log("Error al enviar correo:", error);
//     } else {
//       console.log("Correo enviado: " + info.response);
//     }
//   });
// };

// // Programar la nueva tarea para enviar correos cada 2 minutos
// cron.schedule("*/2 * * * *", async () => {
//   console.log("Enviando correos...");

//   try {
//     const correos = [
//       "marcebenitez0607@gmail.com",
//       "bodinidev@gmail.com",
//       "lucas.quaroni@gmail.com",
//     ]; // Obtener correos desde la base de datos

//     if (correos.length === 0) {
//       console.log("No hay correos activos para enviar.");
//       return;
//     }

//     const mensaje =
//       "Recordatorio: No olvides realizar el pago de tu factura mensual. En caso de ya haberlo realizado, ignora este mensaje.";

//     // Enviar correo a cada destinatario
//     correos.forEach((correo) => {
//       sendEmail(correo, "Recordatorio Mensual", mensaje);
//     });
//   } catch (error) {
//     console.error("Error en la tarea de correos:", error);
//   }
// });
