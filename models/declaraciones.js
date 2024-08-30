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
