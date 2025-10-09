// utils/dateUtils.js
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as cheerio from "cheerio";
import { transporter } from "../mailer.js";

export const formatDate = (dateString) => {
  if (!dateString) {
    return null;
  }
  return format(new Date(dateString), "dd/MM/yy HH:mm", { locale: es });
};

export const formatedHTML = (content) => {
  const $ = cheerio.load(content);

  const textoLimpio = $.text();

  return textoLimpio.trim();
};

export const sendNewCompanyNotification = async (companyData) => {
  try {
    const {
      cuit,
      name,
      address,
      phone,
      location,
      contactName,
      contactLastName,
      contactPhone,
      contactEmail,
    } = companyData;

    const mailOptions = {
      from: "uesevirosario@gmail.com",
      to: "administracion@uesevi.org.ar",
      subject: "Nueva Empresa Registrada - Requiere Revisión",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">Nueva Empresa Registrada</h2>
          
          <p style="font-size: 16px; color: #34495e; margin-bottom: 20px;">
            Se ha registrado una nueva empresa en el sistema que requiere revisión y aprobación.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-top: 0;">Datos de la Empresa:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c3e50; width: 40%;">CUIT:</td>
                <td style="padding: 8px 0; color: #34495e;">${cuit}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Nombre:</td>
                <td style="padding: 8px 0; color: #34495e;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Dirección:</td>
                <td style="padding: 8px 0; color: #34495e;">${address}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Teléfono:</td>
                <td style="padding: 8px 0; color: #34495e;">${
                  phone || "No especificado"
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Localidad:</td>
                <td style="padding: 8px 0; color: #34495e;">${
                  location || "No especificada"
                }</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #e8f4fd; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-top: 0;">Datos de Contacto:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c3e50; width: 40%;">Nombre:</td>
                <td style="padding: 8px 0; color: #34495e;">${contactName} ${contactLastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Teléfono:</td>
                <td style="padding: 8px 0; color: #34495e;">${
                  contactPhone || "No especificado"
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Email:</td>
                <td style="padding: 8px 0; color: #34495e;">${
                  contactEmail || "No especificado"
                }</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-weight: bold;">
              ⚠️ Acción Requerida: Esta empresa está en estado "Pendiente" y requiere revisión administrativa.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6c757d; text-align: center; margin-top: 30px; border-top: 1px solid #dee2e6; padding-top: 20px;">
            Este es un mensaje automático del sistema UESEVI.<br>
            Fecha de registro: ${formatDate(new Date())}
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Correo de notificación de nueva empresa enviado exitosamente");
    return { success: true, message: "Correo enviado exitosamente" };
  } catch (error) {
    console.error("Error al enviar correo de notificación:", error);
    return { success: false, error: error.message };
  }
};
