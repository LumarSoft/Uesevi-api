import { pool } from "../db/db.js";

const declaracionesViejasModel = {
  getAll: async () => {
    const query = `
      SELECT dj.*, e.nombre AS nombre_empresa, e.cuit AS cuit_empresa
      FROM old_declaraciones_juradas dj
      INNER JOIN old_empresas e ON dj.old_empresa_id = e.id
      ORDER BY dj.fecha DESC
    `;

    const [results] = await pool.query(query);
    return results;
  },

  getOne: async (id) => {
    const query = `
    SELECT * FROM old_declaraciones_juradas WHERE id = ?
    `;
    const [result] = await pool.query(query, id);
    return result[0];
  },

  getInfo: async (idEmpresa, idDeclaracion) => {
    const query = `SELECT 
    d.id,
    e.nombre AS nombre_empresa,
    COUNT(DISTINCT emp.id) AS cantidad_empleados_declaracion,
    COUNT(DISTINCT CASE WHEN emp.sindicato_activo = 1 THEN emp.id END) AS cantidad_afiliados_declaracion,
    d.year,
    d.mes,
    d.rectificada
FROM 
    old_contratos c
INNER JOIN 
    old_empleados emp ON c.old_empleado_id = emp.id
INNER JOIN 
    old_usuarios u ON emp.old_usuario_id = u.id
INNER JOIN 
    old_empresas e ON c.old_empresa_id = e.id
INNER JOIN 
    old_declaraciones_juradas d ON d.id = 638
WHERE 
    c.old_empresa_id = 81
    AND c.deleted IS NULL`;
    const [result] = await pool.query(query, [idDeclaracion, idEmpresa]);

    const query2 = `SELECT 
    CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo, 
    CASE WHEN emp.sindicato_activo = 1 THEN 'Sí' ELSE 'No' END AS afiliado,
    emp.cuil,
    s.sueldo_basico,
    c2.nombre AS categoria,
    s.adicional,
    (s.sueldo_basico + s.adicional) AS total_bruto
FROM 
    old_sueldos s
INNER JOIN 
    (SELECT 
        old_contrato_id, 
        MAX(created) AS max_created
    FROM 
        old_sueldos 
    GROUP BY 
        old_contrato_id) AS max_sueldos 
    ON s.old_contrato_id = max_sueldos.old_contrato_id 
    AND s.created = max_sueldos.max_created
INNER JOIN 
    old_contratos c ON s.old_contrato_id = c.id
INNER JOIN 
    old_empleados emp ON c.old_empleado_id = emp.id
INNER JOIN 
    old_usuarios u ON emp.old_usuario_id = u.id
INNER JOIN 
    old_categorias c2 ON s.old_categoria_id = c2.id
WHERE 
    c.old_empresa_id = ?
    AND c.deleted IS NULL
    AND u.id IN (
        SELECT DISTINCT u.id
        FROM usuarios u
        INNER JOIN old_empleados emp ON u.id = emp.old_usuario_id
        INNER JOIN old_contratos c ON emp.id = c.old_empleado_id
        WHERE c.old_empresa_id = ?
        AND c.deleted IS NULL
    );
`;

    const [result2] = await pool.query(query2, [idEmpresa, idEmpresa]);

    return { ...result[0], empleados: result2 };
  },
};

export default declaracionesViejasModel;
