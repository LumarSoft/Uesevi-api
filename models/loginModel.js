import { pool } from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const loginModel = {
  getUser: async (email, password) => {
    try {
      const query = `SELECT * FROM usuarios WHERE email = ?`;
      const [results] = await pool.query(query, [email]);

      if (results.length === 0) {
        return { error: true, message: "El correo electrónico no existe" };
      }

      const user = results[0];

      let hashedPassword = user.password;

      // Convertir el hash almacenado si es necesario
      if (hashedPassword.startsWith("$2y$")) {
        hashedPassword = hashedPassword.replace("$2y$", "$2b$");
      }

      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (!passwordMatch) {
        return { error: true, message: "Contraseña incorrecta" };
      }

      // Generar un JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return { user: { id: user.id, email: user.email, rol: user.rol }, token };
    } catch (err) {
      console.error("Error en la consulta de usuario:", err);
      throw err;
    }
  },

  loginEmpresa: async (email, password) => {
    try {
      // Primero lo que tenemos que hacer es consultar a la tabla usuarios si el email existe, si el rol es "empresa"
      const query = `SELECT * FROM usuarios WHERE email = ? AND rol = "empresa"`;

      const [results] = await pool.query(query, [email]);

      //Validamos que haya encontrado algo
      if (results.length === 0) {
        return { error: true, message: "El correo electrónico no existe" };
      }

      //Validamos la contrasenia
      const user = results[0];

      let hashedPassword = user.password;

      // Convertir el hash almacenado si es necesario

      if (hashedPassword.startsWith("$2y$")) {
        hashedPassword = hashedPassword.replace("$2y$", "$2b$");
      }

      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (!passwordMatch) {
        return { error: true, message: "Contraseña incorrecta" };
      }

      // Ahora una vez que obtenemos el id del usuario empresa, consultamos en la tabla empresa para ver si existe un usuario con ese id

      const queryEmpresa = `SELECT * FROM empresas WHERE usuario_id = ?`;
      const [resultsEmpresa] = await pool.query(queryEmpresa, [user.id]);

      // Validamos que haya encontrado algo
      if (resultsEmpresa.length === 0) {
        return {
          error: true,
          message: "El usuario no tiene una empresa asociada",
        };
      }

      // En caso que el usuario en la tabla empresas tenga el estado "Pendiente". Devolvemos un error informando que se encuentra en estado pendiente aun
      if (resultsEmpresa[0].estado === "Pendiente") {
        return {
          error: true,
          message: "La empresa se encuentra en estado pendiente",
        };
      }

      // Generar un JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          rol: user.rol,
          empresa: resultsEmpresa[0],
        },
        token,
      };
    } catch (error) {
      console.error("Error en la consulta de empresa:", error);
      throw error;
    }
  },
};

export default loginModel;
