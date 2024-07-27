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
};

export default loginModel;
