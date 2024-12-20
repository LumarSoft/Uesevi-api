import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "uesevirosario@gmail.com",
    pass: "ytzlkqnsolxwbajm",
  },
});

transporter.verify().then(() => {
  console.log("Listo para enviar correos");
});
