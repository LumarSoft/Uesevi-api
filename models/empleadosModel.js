// models/empleadosModel.js
import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const empleadosModel = {
  getAll: async () => {
    const query = `
      SELECT 
        CONCAT(u.nombre, ' ', u.apellido) AS nombre,
        u.email,
        e.cuil, 
        c.created,
        c.empresa_id,
        empresas.nombre as nombre_empresa,
        e.sindicato_activo
      FROM 
        usuarios u
      JOIN 
        empleados e ON u.id = e.usuario_id
      JOIN 
        contratos c ON e.id = c.empleado_id
      JOIN
        empresas ON c.empresa_id = empresas.id
    `;
    const [results] = await pool.query(query);

    // Formatea las fechas
    const formattedResults = results.map((result) => ({
      ...result,
      created: formatDate(result.created),
    }));

    return formattedResults;
  }
};

export default empleadosModel;