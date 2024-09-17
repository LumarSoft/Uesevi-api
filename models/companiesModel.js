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
    // Primero tenemos que crear el registro en la tabla usuario
    //Como la tabla usuarios no tiene autoincrement en el Id debemos obtener el ultimo id y sumarle 1
    const query = `SELECT MAX(id) as id FROM usuarios`;
    const [results] = await pool.query(query);
    const id = results[0].id + 1;

    // Ahora insertamos el usuario

    const queryUsuario = `INSERT INTO usuarios (id,email,password,nombre,apellido,telefono,rol,estado,created,modified) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())`;
    await pool.query(queryUsuario, [
      id,
      username,
      password,
      contactName,
      contactLastName,
      contactPhone,
      "empresa",
      "Activo",
    ]);

    //Por el momento vamos a poner inicialmente en la tabla usuarios el estado de las empresas como "activo" despues vemos si es necesario cambiarlo

    // Ahora insertamos la empresa
    //Tambien nos tenemos que traer el ultimo id de la tabla empresas
    const queryEmpresa = `SELECT MAX(id) as id FROM empresas`;
    const [resultsEmpresa] = await pool.query(queryEmpresa);
    const idEmpresa = resultsEmpresa[0].id + 1;

    const queryEmpresaInsert = `INSERT INTO empresas (id,usuario_id,cuit,nombre,domicilio,telefono,ciudad,estado,email_contacto,created,modified) VALUES (
      ?,?,?,?,?,?,?,?,?,NOW(),NOW())`;
    await pool.query(queryEmpresaInsert, [
      idEmpresa,
      id,
      cuit,
      name,
      address,
      phone,
      location,
      "Pendiente",
      contactEmail,
    ]);

    return { message: "Empresa creada" };
  },
};

export default companiesModel;
