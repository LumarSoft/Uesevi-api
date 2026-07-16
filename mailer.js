import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER || "uesevirosario@gmail.com",
    pass: process.env.MAIL_PASS || "ytzlkqnsolxwbajm",
  },
});

transporter
  .verify()
  .then(() => {
    console.log("Listo para enviar correos");
  })
  .catch((err) => {
    console.warn(
      `⚠️  Mailer no disponible (los correos no se enviarán): ${err.message}`
    );
  });
