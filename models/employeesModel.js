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
    u.estado = 1 
    AND u.rol = 'empleado'
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
    const query = `SELECT 
  CONCAT(apellido,', ',nombre) AS nombre, 
  id
FROM 
  usuarios 
WHERE 
  id IN (
    SELECT 
      usuario_id 
    FROM 
      empleados 
    WHERE 
      id IN (
        SELECT 
          DISTINCT empleado_id 
        FROM 
          contratos 
        WHERE 
          empresa_id = ?
      )
  );
`;
    const [results] = await pool.query(query, [id]);
    return results;
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
};

export default employeesModel;
