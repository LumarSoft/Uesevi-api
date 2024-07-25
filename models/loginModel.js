import { pool } from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const loginModel = {
  getUser: async (email, password, rol) => {
    try {
      const query = `SELECT * FROM usuarios WHERE email = ? AND rol = ?`;
      const [results] = await pool.query(query, [email, rol]);

      if (results.length === 0) {
        console.log("No se encontró ningún usuario con ese correo electrónico");
        return null;
      }

      const user = results[0];

      let hashedPassword = user.password;

      // Convertir el hash almacenado si es necesario
      if (hashedPassword.startsWith("$2y$")) {
        hashedPassword = hashedPassword.replace("$2y$", "$2b$");
      }

      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (!passwordMatch) {
        console.log("La contraseña no coincide");
        return null;
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
