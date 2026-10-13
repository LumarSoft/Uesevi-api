import { pool } from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pickEmpresaUser, EMAIL_COMPARTIDO_MESSAGE } from "../utils/accountUtils.js";

// Usuarios empresa activos con ese email, en orden estable. usuarios.email no
// tiene UNIQUE: en datos viejos puede haber más de uno (o uno eliminado).
const EMPRESA_USERS_BY_EMAIL = `
  SELECT * FROM usuarios
  WHERE email = ? AND rol = "empresa" AND deleted IS NULL
  ORDER BY id`;

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
  generateToken: (user, idEmpresa) => {
    const payload = { id: user.id, email: user.email, rol: user.rol };
    if (idEmpresa !== undefined) {
      payload.idEmpresa = idEmpresa;
    }
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  },

  // Función para hashear contraseña
  hashPassword: async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
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

      const [candidates] = await connection.query(EMPRESA_USERS_BY_EMAIL, [
        email,
      ]);

      // Si el email está repetido, sólo entra el usuario cuya contraseña
      // coincide. Antes se tomaba results[0] sin ORDER BY y una empresa podía
      // terminar logueada en la otra.
      const picked = await pickEmpresaUser(candidates, (candidate) =>
        loginModel.comparePassword(password, candidate.password)
      );

      if (picked.error === "NO_EXISTE") {
        return { error: true, message: "El correo electrónico no existe" };
      }
      if (picked.error === "PASSWORD") {
        return { error: true, message: "Contraseña incorrecta" };
      }
      if (picked.error === "AMBIGUO") {
        return { error: true, message: EMAIL_COMPARTIDO_MESSAGE };
      }

      const user = picked.user;

      const queryEmpresa = `SELECT * FROM empresas WHERE usuario_id = ? ORDER BY id LIMIT 1`;
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

      const token = loginModel.generateToken(user, empresa.id);

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

  // Cantidad de usuarios empresa activos con ese email (0, 1 o más si el
  // email quedó compartido entre empresas).
  countEmpresaUsersByEmail: async (email) => {
    const [results] = await pool.query(
      `SELECT COUNT(*) AS count FROM usuarios WHERE email = ? AND rol = "empresa" AND deleted IS NULL`,
      [email]
    );
    return Number(results[0].count);
  },

  // Verificar si existe un email de empresa
  checkEmpresaEmail: async (email) =>
    (await loginModel.countEmpresaUsersByEmail(email)) > 0,

  // Actualizar contraseña de empresa
  updateEmpresaPassword: async (email, newPassword) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Verificar que el email identifica a UNA sola empresa. Antes el UPDATE
      // era "WHERE email = ?" y cambiaba la clave de todos los usuarios con
      // ese email (incluso de otras empresas).
      const [results] = await connection.query(
        `SELECT id FROM usuarios WHERE email = ? AND rol = "empresa" AND deleted IS NULL`,
        [email]
      );

      if (results.length !== 1) {
        await connection.rollback();
        return false;
      }

      // Hashear la nueva contraseña
      const hashedPassword = await loginModel.hashPassword(newPassword);

      // Actualizar la contraseña sólo de ese usuario
      const queryUpdate = `UPDATE usuarios SET password = ?, modified = NOW() WHERE id = ? AND rol = "empresa"`;
      await connection.query(queryUpdate, [hashedPassword, results[0].id]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error("Error al actualizar contraseña:", error);
      throw new Error("Error al actualizar contraseña");
    } finally {
      connection.release();
    }
  },
};

export default loginModel;
