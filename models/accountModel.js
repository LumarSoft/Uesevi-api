import { pool } from "../db/db.js";

// "Mi cuenta" de las empresas: datos de acceso del usuario logueado.
// Siempre se opera sobre el id del token (req.user.id), nunca sobre un id
// que mande el front.
const accountModel = {
  // Datos visibles de la cuenta + la empresa asociada. Sin el hash.
  getAccount: async (userId) => {
    const [users] = await pool.query(
      `SELECT id, email, nombre, apellido, telefono
       FROM usuarios
       WHERE id = ? AND rol = "empresa" AND deleted IS NULL
       LIMIT 1`,
      [userId]
    );
    if (users.length === 0) return null;

    const [empresas] = await pool.query(
      `SELECT id, nombre, cuit, email_contacto
       FROM empresas
       WHERE usuario_id = ?
       ORDER BY id
       LIMIT 1`,
      [userId]
    );

    return { ...users[0], empresa: empresas[0] || null };
  },

  // Incluye el hash: sólo para verificar la contraseña actual.
  getCredentials: async (userId) => {
    const [users] = await pool.query(
      `SELECT id, email, password, rol
       FROM usuarios
       WHERE id = ? AND rol = "empresa" AND deleted IS NULL
       LIMIT 1`,
      [userId]
    );
    return users[0] || null;
  },

  // ¿Otro usuario empresa activo ya usa ese email? (usuarios.email no tiene UNIQUE)
  isEmailTaken: async (email, excludeUserId) => {
    const [results] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM usuarios
       WHERE email = ? AND rol = "empresa" AND deleted IS NULL AND id <> ?`,
      [email, excludeUserId]
    );
    return Number(results[0].count) > 0;
  },

  updateEmail: async (userId, email) => {
    const [result] = await pool.query(
      `UPDATE usuarios SET email = ?, modified = NOW()
       WHERE id = ? AND rol = "empresa" AND deleted IS NULL`,
      [email, userId]
    );
    return result.affectedRows;
  },

  updatePassword: async (userId, hashedPassword) => {
    const [result] = await pool.query(
      `UPDATE usuarios SET password = ?, modified = NOW()
       WHERE id = ? AND rol = "empresa" AND deleted IS NULL`,
      [hashedPassword, userId]
    );
    return result.affectedRows;
  },
};

export default accountModel;
