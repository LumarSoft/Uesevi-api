import { pool } from "../db/db.js";

const declaracionesModel = {
  getAll: async () => {
    const query = `
     SELECT
  dj.*,
  e.nombre AS nombre_empresa,
  e.cuit AS cuit_empresa
FROM
  declaraciones_juradas dj
INNER JOIN
  empresas e ON dj.empresa_id = e.id
INNER JOIN (
  SELECT
    empresa_id,
    mes,
    year,
    MAX(rectificada) AS max_rectificada
  FROM
    declaraciones_juradas
  GROUP BY
    empresa_id, mes, year
) AS max_dj ON dj.empresa_id = max_dj.empresa_id
  AND dj.mes = max_dj.mes
  AND dj.year = max_dj.year
  AND dj.rectificada = max_dj.max_rectificada
ORDER BY
  dj.modified DESC;
    `;
    const [results] = await pool.query(query);
    return results;
  },

  getOne: async (id) => {
    const query = `
      SELECT dj.*, e.nombre AS nombre_empresa, e.cuit AS cuit_empresa
      FROM declaraciones_juradas dj
      INNER JOIN empresas e ON dj.empresa_id = e.id
      WHERE dj.id = ?
    `;
    const [result] = await pool.query(query, id);
    return result[0];
  },

  getInfo: async (idEmpresa, idDeclaracion) => {
    const query = `SELECT 
    e.nombre AS nombre_empresa,
    COUNT(DISTINCT emp.id) AS cantidad_empleados_declaracion,
    COUNT(DISTINCT CASE WHEN emp.sindicato_activo = 1 THEN emp.id END) AS cantidad_afiliados_declaracion,
    d.year,
    d.mes,
    d.rectificada,
    d.vencimiento,
    d.fecha_pago
FROM 
    contratos c
INNER JOIN 
    empleados emp ON c.empleado_id = emp.id
INNER JOIN 
    usuarios u ON emp.usuario_id = u.id
INNER JOIN 
    empresas e ON c.empresa_id = e.id
INNER JOIN 
    declaraciones_juradas d ON d.id = ?
WHERE 
    c.empresa_id = ?
    AND c.deleted IS NULL`;
    const [result] = await pool.query(query, [idDeclaracion, idEmpresa]);

    const query2 = `SELECT 
    CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo, 
    CASE WHEN emp.sindicato_activo = 1 THEN 'Sí' ELSE 'No' END AS afiliado,
    emp.cuil,
    s.sueldo_basico,
    s.remunerativo_adicional,
    s.adicional_norem AS suma_no_remunerativa,
    c2.nombre AS categoria,
    s.adicional,
    (s.sueldo_basico + s.remunerativo_adicional + s.adicional_norem + s.adicional) AS total_bruto
FROM 
    sueldos s
INNER JOIN 
    (SELECT 
        contrato_id, 
        MAX(created) AS max_created 
    FROM 
        sueldos 
    GROUP BY 
        contrato_id) AS max_sueldos 
    ON s.contrato_id = max_sueldos.contrato_id 
    AND s.created = max_sueldos.max_created
INNER JOIN 
    contratos c ON s.contrato_id = c.id
INNER JOIN 
    empleados emp ON c.empleado_id = emp.id
INNER JOIN 
    usuarios u ON emp.usuario_id = u.id
INNER JOIN 
    categorias c2 ON s.categoria_id = c2.id
WHERE 
    c.empresa_id = ?
    AND c.deleted IS NULL
    AND u.id IN (
        SELECT DISTINCT u.id
        FROM usuarios u
        INNER JOIN empleados emp ON u.id = emp.usuario_id
        INNER JOIN contratos c ON emp.id = c.empleado_id
        WHERE c.empresa_id = ?
        AND c.deleted IS NULL
    );
`;

    const [result2] = await pool.query(query2, [idEmpresa, idEmpresa]);

    return { ...result[0], empleados: result2 };
  },

  getHistory: async (idEmpresa, year, month) => {
    const query = `
      SELECT dj.*, e.nombre AS nombre_empresa, e.cuit AS cuit_empresa
      FROM declaraciones_juradas dj
      INNER JOIN empresas e ON dj.empresa_id = e.id
      WHERE dj.empresa_id = ? AND dj.year = ? AND dj.mes = ?
      ORDER BY dj.modified DESC
    `;
    const [results] = await pool.query(query, [idEmpresa, year, month]);
    return results;
  },

  changeState: async (id, state) => {
    let query;

    // En caso que los estados sean 1 o 2 tambien cambiar la fecha_pago con la fecha actual

    if (state === "1" || state === "2") {
      query = `
        UPDATE declaraciones_juradas
        SET estado = ?, fecha_pago = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
    } else {
      query = `
        UPDATE declaraciones_juradas
        SET estado = ?
        WHERE id = ?
      `;
    }

    const result = await pool.query(query, [state, id]);
    return result;
  },

  changeDatePayment: async (id, date) => {
    const queryTasa = `SELECT porcentaje FROM tasa`;
    const [resultTasa] = await pool.query(queryTasa);
    const porcentaje = parseFloat(resultTasa[0].porcentaje);

    const queryDatoDeclaracion = `SELECT vencimiento, subtotal FROM declaraciones_juradas WHERE id = ?`;
    const [resultDatoDeclaracion] = await pool.query(queryDatoDeclaracion, id);
    const vencimiento = new Date(resultDatoDeclaracion[0].vencimiento);
    const subtotal = parseFloat(resultDatoDeclaracion[0].subtotal);

    const datePayment = new Date(date);

    const diffTime = Math.abs(vencimiento - datePayment);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const intereses = (subtotal * porcentaje * diffDays) / 100;

    // Redondear a dos decimales
    const interesesRedondeado = parseFloat(intereses.toFixed(2));
    const importe = parseFloat((subtotal + interesesRedondeado).toFixed(2));

    console.log("subtotal:", subtotal);
    console.log("intereses:", interesesRedondeado);
    console.log("importe:", importe);

    const datePaymentPlusOne = new Date(datePayment);
    datePaymentPlusOne.setDate(datePaymentPlusOne.getDate() + 1);

    const queryUpdate = `UPDATE declaraciones_juradas SET vencimiento = ?, importe = ?, interes = ? WHERE id = ?`;
    const [result] = await pool.query(queryUpdate, [
      //Sumale un dia a datePayment
      datePaymentPlusOne,
      importe,
      interesesRedondeado,
      id,
    ]);
  },
};

export default declaracionesModel;
