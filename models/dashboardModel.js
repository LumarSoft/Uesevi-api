import { pool } from "../db/db.js";

const dashboardModel = {
  getAll: async () => {
    // Consulta modificada para excluir empresas inactivas del dashboard
    // Solo se cuentan empresas con estado = 'Activo' y empleados de esas empresas
    const query = `SELECT 
    (SELECT COUNT(*) 
     FROM usuarios u 
     JOIN empresas em ON u.id = em.usuario_id 
     WHERE u.rol = 'empresa' 
       AND em.estado = 'Activo') AS total_empresas,
    (SELECT COUNT(DISTINCT u.id) 
     FROM usuarios u
     JOIN empleados e ON u.id = e.usuario_id
     JOIN contratos c ON e.id = c.empleado_id
     JOIN empresas em ON c.empresa_id = em.id
     WHERE u.estado = '1' 
       AND u.rol = 'empleado'
       AND c.estado = '1' 
       AND c.deleted IS NULL
       AND em.estado = 'Activo') AS total_empleados,
    (SELECT COUNT(DISTINCT e.id) 
     FROM empleados e
     JOIN usuarios u ON e.usuario_id = u.id
     JOIN contratos c ON e.id = c.empleado_id
     JOIN empresas em ON c.empresa_id = em.id
     WHERE u.estado = '1' 
       AND u.rol = 'empleado'
       AND c.estado = '1' 
       AND c.deleted IS NULL
       AND e.sindicato_activo = 1
       AND em.estado = 'Activo') AS empleados_con_sindicato_activo;
    `;

    const [results] = await pool.query(query);

    return results;
  },
};

export default dashboardModel;
