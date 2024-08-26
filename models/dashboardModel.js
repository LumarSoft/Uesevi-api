import { pool } from "../db/db.js";

const dashboardModel = {
  getAll: async () => {
    const query = `SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'empresa') AS total_empresas,
        (SELECT COUNT(1) FROM usuarios where id IN (SELECT DISTINCT empleado_id FROM contratos WHERE empleado_id IN (SELECT id FROM usuarios WHERE estado = 1 AND rol = 'empleado') AND estado = 1 AND deleted IS NULL)) AS total_empleados,
        (SELECT COUNT(1) FROM empleados WHERE usuario_id IN (SELECT id FROM usuarios where id IN (SELECT DISTINCT empleado_id FROM contratos WHERE empleado_id IN (SELECT id FROM usuarios WHERE estado = 1 AND rol = 'empleado') AND estado = 1 AND deleted IS NULL)) AND sindicato_activo = 1) AS empleados_con_sindicato_activo;
    `;

    const [results] = await pool.query(query);

    return results;
  },
};

export default dashboardModel;
