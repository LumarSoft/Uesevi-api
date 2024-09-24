// models/empleadosModel.js
import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const employeesModel = {
  getAll: async () => {
    const query = `
    SELECT DISTINCT
    CONCAT(u.apellido, ', ', u.nombre) AS nombre,
    u.email,
    e.cuil, 
    e.categoria_id,
    c.created,
    c.empresa_id,
    em.nombre AS nombre_empresa,
    e.sindicato_activo 
FROM 
    usuarios u
INNER JOIN 
    empleados e ON u.id = e.usuario_id
INNER JOIN 
    contratos c ON e.id = c.empleado_id
INNER JOIN 
    empresas em ON c.empresa_id = em.id
WHERE 
    u.rol = 'empleado'
    AND c.estado = 1 
    AND c.deleted IS NULL;
    `;
    const [results] = await pool.query(query);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  },

  getByEmpresa: async (id) => {
    const query = `
    SELECT DISTINCT
    u.id,
    u.apellido,
    u.nombre,
      u.email,
      u.telefono,
      u.estado,
      e.cuil, 
      e.domicilio,
      e.categoria_id,
      c.created,
      c.empresa_id,
      em.nombre AS nombre_empresa,
      e.sindicato_activo 
    FROM 
      usuarios u
    INNER JOIN 
      empleados e ON u.id = e.usuario_id
    INNER JOIN 
      contratos c ON e.id = c.empleado_id
    INNER JOIN 
      empresas em ON c.empresa_id = em.id
    WHERE 
      u.rol = 'empleado'
      AND c.estado = 1 
      AND c.deleted IS NULL
      AND u.deleted IS NULL
      AND c.empresa_id = ?;
    `;

    const [results] = await pool.query(query, [id]);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  },

  getOldByEmpresa: async (id) => {
    const query = `SELECT 
  CONCAT(apellido,', ',nombre) AS nombre, 
  id
FROM 
  old_usuarios 
WHERE 
  id IN (
    SELECT 
      old_usuario_id 
    FROM 
      old_empleados 
    WHERE 
      id IN (
        SELECT 
          DISTINCT old_empleado_id 
        FROM 
          old_contratos 
        WHERE 
          old_empresa_id = ?
      )
  );
`;
    const [results] = await pool.query(query, [id]);
    return results;
  },

  addEmployee: async (employee) => {},

  editEmployee: async (
    id,
    firstName,
    lastName,
    cuil,
    category,
    employmentStatus,
    unionMembership
  ) => {
    // Primerop actualizamos en la tabla usuarios
    const query =
      "UPDATE usuarios SET nombre = ?, apellido = ?, estado = ? WHERE id = ?";
    await pool.query(query, [firstName, lastName, employmentStatus, id]);

    // Luego actualizamos en la tabla empleados

    const query2 =
      "UPDATE empleados SET cuil = ?, categoria_id = ?, sindicato_activo = ? WHERE usuario_id = ?";
    await pool.query(query2, [cuil, category, unionMembership, id]);

    return;
  },

  deleteEmployee: async (id) => {
    const query = "UPDATE usuarios SET deleted = NOW() WHERE id = ?";
    await pool.query(query, [id]);
  },
};

export default employeesModel;
