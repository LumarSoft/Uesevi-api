// Cálculo de intereses del Panel de Pagos.
//
// Centraliza la fórmula ya usada en statementsModel.changeDatePayment para
// reutilizarla desde el panel (preview y upsert de pago) sin duplicarla.
// Se mantiene el MISMO criterio de vencimiento e interés que el flujo existente
// para que los intereses del panel coincidan con el resto del sistema.
// Ver docs/Uesevi_Evolutivo_Panel_de_Pagos_PLAN_TECNICO.md (Sección 3).

const round2 = (n) => parseFloat(Number(n).toFixed(2));

/**
 * Calcula el interés por atraso sobre un subtotal.
 *
 * @param {Object} params
 * @param {number} params.subtotal   Base de cálculo (importe propuesto).
 * @param {number} params.mes        Mes de la DDJJ (1-12).
 * @param {number} params.year       Año de la DDJJ.
 * @param {string|Date} params.fechaPago  Fecha real de pago.
 * @param {number} params.porcentaje Tasa diaria (tabla `tasa.porcentaje`).
 * @returns {{ diasAtraso: number, interes: number, importe: number }}
 */
export const calcInterest = ({ subtotal, mes, year, fechaPago, porcentaje }) => {
  const base = Number(subtotal) || 0;
  const rate = Number(porcentaje) || 0;

  // Vencimiento: mismo criterio que statementsModel.changeDatePayment
  // (new Date(year, mes + 1, 0)). Usamos el año real de la DDJJ.
  const vencimiento = new Date(year, mes + 1, 0);

  // Se suma +1 día a la fecha de pago, igual que el flujo actual.
  const datePayment = new Date(fechaPago);
  datePayment.setDate(datePayment.getDate() + 1);

  let diasAtraso = 0;
  let interes = 0;
  let importe = base;

  if (datePayment > vencimiento) {
    const diffTime = Math.abs(datePayment - vencimiento);
    diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
    interes = round2((base * rate * diasAtraso) / 100);
    importe = round2(base + interes);
  }

  return { diasAtraso, interes, importe };
};

export default { calcInterest };
