import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const companiesModel = {
  getAll: async () => {
    const query = `
      SELECT em.*, us.nombre as nombre_usuario, us.apellido, us.telefono as telefono_usuario
      FROM empresas em
      INNER JOIN usuarios us ON us.id = em.usuario_id
      ORDER BY CASE WHEN em.estado = 'pendiente' THEN 0 ELSE 1 END, em.estado ASC
    `;

    const [results] = await pool.query(query);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
      modified: formatDate(result.modified),
    }));

    return formattedResults;
  },

  getInPending: async () => {
    const query = `SELECT COUNT(*) as cantidad FROM empresas WHERE estado = 'Pendiente'`;
    const [results] = await pool.query(query);
    return results[0];
  },

  changeState: async (id, state) => {
    try {
      const query = `UPDATE empresas SET estado = ? WHERE id = ?`;
      const [results] = await pool.query(query, [state, id]);
      return results;
    } catch (e) {
      console.error(e);
    }
  },

  delete: async (id) => {
    try {
      const query = `DELETE FROM empresas WHERE id = ?`;
      const [results] = await pool.query(query, [id]);
      return results;
    } catch (e) {
      console.error(e);
    }
  },

  create: async (
    cuit,
    name,
    address,
    phone,
    location,
    contactName,
    contactLastName,
    contactPhone,
    contactEmail,
    username,
    password
  ) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction(); // Inicia la transacción

      const queryLastIdUsuario = `SELECT id FROM usuarios ORDER BY id DESC LIMIT 1`;

      const [resultLastIdUsuario] = await connection.query(queryLastIdUsuario);

      const LastIdUsuario = resultLastIdUsuario[0].id;

      console.log(LastIdUsuario);

      const queryUsuario = `INSERT INTO usuarios (id,email, password, nombre, apellido, telefono, rol, created, modified) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
      const [resultUsuario] = await connection.query(queryUsuario, [
        LastIdUsuario + 1,
        username,
        password,
        contactName,
        contactLastName,
        contactPhone,
        "empresa",
      ]);

      const queryLastIdEmpresa = `SELECT id FROM empresas ORDER BY id DESC LIMIT 1`;

      const [resultLastIdEmpresa] = await connection.query(queryLastIdEmpresa);

      const LastIdEmpresa = resultLastIdEmpresa[0].id;

      const queryEmpresaInsert = `INSERT INTO empresas (id, usuario_id, cuit, nombre, domicilio, telefono, ciudad, estado, email_contacto, created, modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
      await connection.query(queryEmpresaInsert, [
        LastIdEmpresa + 1,
        LastIdUsuario + 1,
        cuit,
        name,
        address,
        phone,
        location,
        "Pendiente",
        contactEmail,
      ]);

      await connection.commit(); // Confirma la transacción
      return { message: "Empresa creada exitosamente" };
    } catch (error) {
      await connection.rollback(); // Revierte la transacción si hay un error
      console.error(error);
      throw new Error("Error al crear la empresa: " + error.message);
    } finally {
      connection.release(); // Libera la conexión
    }
  },
};

export default companiesModel;
