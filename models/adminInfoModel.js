import { pool } from "../db/db.js";
import { format, isValid } from "date-fns";

const usuariosAdminModel = {
  getAll: async () => {
    const query = `SELECT *, CONCAT(nombre, ' ', apellido) as nombre FROM usuarios WHERE rol = 'admin'`;

    const [results] = await pool.query(query);

    const formattedResults = results.map((result) => {
      let formattedCreated = null;

      if (result.created !== null && result.created !== "0000-00-00 00:00:00") {
        const date = new Date(result.created);
        if (isValid(date)) {
          try {
            formattedCreated = format(date, "yyyy-MM-dd HH:mm:ss");
          } catch (error) {
            console.error("Error formateando la fecha:", error);
          }
        } else {
          console.warn(
            "Fecha no válida:",
            result.created,
            "De el usuario: ",
            result.nombre,
            result.apellido
          );
        }
      }

      return {
        ...result,
        created: formattedCreated,
      };
    });

    return formattedResults;
  },

  update: async (id, userData) => {
    try {
      const query = `UPDATE usuarios SET ? WHERE id = ?`;
      const [results] = await pool.query(query, [userData, id]);
      return results;
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      throw error;
    }
  },

  addAdmin: async (userData) => {
    const { email, password, nombre, apellido, telefono } = userData;
    try {
      const checkQuery =
        "SELECT COUNT(*) AS count FROM usuarios WHERE email = ?";
      const [checkResults] = await pool.query(checkQuery, [email]);

      if (checkResults[0].count > 0) {
        throw {
          code: "EMAIL_IN_USE",
          message: "El correo electrónico ya está registrado.",
        };
      }

      const query = `SELECT MAX(id) as id FROM usuarios`;
      const [lastId] = await pool.query(query);
      const created = format(new Date(), "yyyy-MM-dd HH:mm:ss");
      const insertQuery = `INSERT INTO usuarios (id, email, password, nombre, apellido, telefono, created, rol, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'admin', '1')`;
      const [results] = await pool.query(insertQuery, [
        lastId[0].id + 1,
        email,
        password,
        nombre,
        apellido,
        telefono,
        created,
      ]);

      return results;
    } catch (error) {
      console.error("Error al añadir usuario:", error);
      if (error.code === "EMAIL_IN_USE") {
        throw {
          status: 400,
          code: error.code,
          message: error.message,
        };
      } else {
        throw {
          status: 500,
          code: "INTERNAL_SERVER_ERROR",
          message: "Ocurrió un error al añadir el usuario.",
        };
      }
    }
  },
};

export default usuariosAdminModel;
