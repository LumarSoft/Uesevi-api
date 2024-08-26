// models/empleadosModel.js
import { pool } from "../db/db.js";
import { formatDate } from "../utils/utils.js";

const empleadosModel = {
  getAll: async () => {
    const query = `
     SELECT DISTINCT
    CONCAT(u.nombre, ' ', u.apellido) AS nombre,
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
};

export default empleadosModel;
