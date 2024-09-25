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
  addEmployee: async (
    firstName,
    lastName,
    cuil,
    category,
    employmentStatus,
    unionAdhesion,
    email
  ) => {
    try {
      // obtener ultimo id de usuario
      const queryLastId = `SELECT MAX(id) as lastId FROM usuarios`;
      const [resultsLastId] = await pool.query(queryLastId);
      const lastId = resultsLastId[0].lastId;
      // insersion de usario
      const query = `
      INSERT INTO usuarios (id, nombre, apellido, email, created, estado, rol) VALUES (?, ?, ?, ?, NOW(), 1, 'empleado');`;
      const [results] = await pool.query(query, [
        lastId + 1,
        firstName,
        lastName,
        email,
      ]);

      // obtener ultimo id de empleado
      const queryLastIdEmployee = `SELECT MAX(id) as lastId FROM empleados LIMIT 1`;
      const [resultsLastIdEmployee] = await pool.query(queryLastIdEmployee);
      const lastIdEmployee = resultsLastIdEmployee[0].lastId;
      console.log(lastIdEmployee);
      // insersion de empleado
      const queryEmployee = `INSERT INTO empleados (id, cuil, usuario_id, categoria_id, sindicato_activo) VALUES (?, ?, ?, ?, ?);`;
      const [resultsEmployee] = await pool.query(queryEmployee, [
        lastIdEmployee + 1,
        cuil,
        lastId + 1,
        category,
        unionAdhesion,
      ]);

      // insertar en tabla contratos
      const queryLastIdContract = `SELECT MAX(id) as lastId FROM contratos LIMIT 1`;
      const [resultsLastIdContract] = await pool.query(queryLastIdContract);
      const lastIdContract = resultsLastIdContract[0].lastId;

      const queryContract = `INSERT INTO contratos (empleado_id, empresa_id, estado, created) VALUES (?, ?, ?, NOW());`;
      const [resultsContract] = await pool.query(queryContract, [
        lastIdContract + 1,
        1,
        employmentStatus,
      ]);

      return [results, resultsEmployee, resultsContract];
    } catch (error) {}
  },
};

export default employeesModel;
