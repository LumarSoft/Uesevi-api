import { pool } from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const loginModel = {
  // Función para comparar contraseñas
  comparePassword: async (inputPassword, hashedPassword) => {
    // Convertir el hash almacenado si es necesario
    if (hashedPassword.startsWith("$2y$")) {
      hashedPassword = hashedPassword.replace("$2y$", "$2b$");
    }
    return await bcrypt.compare(inputPassword, hashedPassword);
  },

  // Función para generar un JWT
  generateToken: (user) => {
    return jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  },

  getUser: async (email, password) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction(); // Iniciar la transacción

      const query = `SELECT * FROM usuarios WHERE email = ?`;
      const [results] = await connection.query(query, [email]);

      if (results.length === 0) {
        return { error: true, message: "El correo electrónico no existe" };
      }

      const user = results[0];

      const passwordMatch = await loginModel.comparePassword(
        password,
        user.password
      );

      if (!passwordMatch) {
        return { error: true, message: "Contraseña incorrecta" };
      }

      const token = loginModel.generateToken(user);

      await connection.commit(); // Confirmar la transacción

      return {
        user: { id: user.id, email: user.email, rol: user.rol },
        token,
      };
    } catch (err) {
      await connection.rollback(); // Revertir la transacción en caso de error
      console.error("Error en la consulta de usuario:", err);
      throw new Error("Error en la consulta de usuario");
    } finally {
      connection.release(); // Liberar la conexión
    }
  },

  loginEmpresa: async (email, password) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction(); // Iniciar la transacción

      const query = `SELECT * FROM usuarios WHERE email = ? AND rol = "empresa"`;
      const [results] = await connection.query(query, [email]);

      if (results.length === 0) {
        return { error: true, message: "El correo electrónico no existe" };
      }

      const user = results[0];

      const passwordMatch = await loginModel.comparePassword(
        password,
        user.password
      );

      if (!passwordMatch) {
        return { error: true, message: "Contraseña incorrecta" };
      }

      const queryEmpresa = `SELECT * FROM empresas WHERE usuario_id = ?`;
      const [resultsEmpresa] = await connection.query(queryEmpresa, [user.id]);

      if (resultsEmpresa.length === 0) {
        return {
          error: true,
          message: "El usuario no tiene una empresa asociada",
        };
      }

      const empresa = resultsEmpresa[0];

      if (empresa.estado === "Pendiente") {
        return {
          error: true,
          message: "La empresa se encuentra en estado pendiente",
        };
      }

      const token = loginModel.generateToken(user);

      await connection.commit(); // Confirmar la transacción

      return {
        user: {
          id: user.id,
          email: user.email,
          rol: user.rol,
          empresa,
        },
        token,
      };
    } catch (error) {
      await connection.rollback(); // Revertir la transacción en caso de error
      console.error("Error en la consulta de empresa:", error);
      throw new Error("Error en la consulta de empresa");
    } finally {
      connection.release(); // Liberar la conexión
    }
  },
};

export default loginModel;
