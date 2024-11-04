import { pool } from "../db/db.js";

const dashboardModel = {
  getAll: async () => {
    const query = `SELECT 
    (SELECT COUNT(*) FROM usuarios WHERE rol = 'empresa') AS total_empresas,
    (SELECT COUNT(1) FROM usuarios WHERE id IN (
        SELECT DISTINCT empleado_id 
        FROM contratos 
        WHERE empleado_id IN (
            SELECT id 
            FROM usuarios 
            WHERE estado = 1 AND rol = 'empleado'
        ) 
        AND estado = 1 AND deleted IS NULL
    )) AS total_empleados,
    (SELECT COUNT(DISTINCT e.id) 
     FROM empleados e
     JOIN usuarios u ON e.usuario_id = u.id
     JOIN contratos c ON e.id = c.empleado_id
     WHERE u.estado = 1 
       AND u.rol = 'empleado'
       AND c.estado = 1 
       AND c.deleted IS NULL
       AND e.sindicato_activo = 1) AS empleados_con_sindicato_activo;
    `;

    const [results] = await pool.query(query);

    return results;
  },
};

export default dashboardModel;
