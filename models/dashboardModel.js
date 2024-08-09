import { pool } from "../db/db.js";

const dashboardModel = {
  getAll: async () => {
    const query = `SELECT 
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'empresa') AS total_empresas,
        (SELECT COUNT(*) FROM usuarios WHERE rol = 'empleado') AS total_empleados,
        (SELECT COUNT(*) FROM empleados WHERE sindicato_activo = 1) AS empleados_con_sindicato_activo;
    `;

    const [results] = await pool.query(query);

    return results;
  },
};

export default dashboardModel;
