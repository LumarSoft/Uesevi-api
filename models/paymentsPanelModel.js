import { pool } from "../db/db.js";
import { calcInterest } from "../utils/interest.js";

// ============================================================================
// Panel de Pagos de Empresas — capa de datos.
//
// Fuente de la PROPUESTA: declaraciones_juradas (DDJJ vigente = MAX(rectificada)
// por empresa/mes/year) + auxiliar (desglose FAS/Solidario/Sindical) + tasa.
// Los AJUSTES manuales viven en la tabla companion `pagos_panel` (override).
//
// Regla de resolución de valores:
//   valor  = pagos_panel.<campo> (si existe fila y no es NULL) | auxiliar.<campo>
//   estado = 'Pagado'    si pagos_panel.estado_pago = 1 o dj.estado = 1
//          | 'Pendiente' si hay DDJJ vigente sin pagar
//          | 'Sin DDJJ'  si no hay DDJJ para el período
//
// Ver docs/Uesevi_Evolutivo_Panel_de_Pagos_PLAN_TECNICO.md (Secciones 2 y 3).
// ============================================================================

const num = (v) => (v === null || v === undefined ? 0 : Number(v));
const round2 = (n) => parseFloat(Number(n).toFixed(2));

// Selecciona la DDJJ vigente (última rectificativa) de cada período del año,
// con su desglose (auxiliar) y su override (pagos_panel).
const VIGENTES_QUERY = `
  SELECT
    dj.id            AS declaracion_jurada_id,
    dj.empresa_id,
    dj.mes,
    dj.year,
    dj.subtotal,
    dj.importe,
    dj.interes       AS dj_interes,
    dj.fecha_pago    AS dj_fecha_pago,
    dj.estado        AS dj_estado,
    a.fas            AS aux_fas,
    a.solidario      AS aux_solidario,
    a.sindical       AS aux_sindical,
    a.total          AS aux_total,
    pp.id            AS pp_id,
    pp.fecha_pago    AS pp_fecha_pago,
    pp.importe_fas   AS pp_fas,
    pp.importe_solidario AS pp_solidario,
    pp.importe_sindical  AS pp_sindical,
    pp.importe_intereses AS pp_intereses,
    pp.total         AS pp_total,
    pp.estado_pago   AS pp_estado
  FROM declaraciones_juradas dj
  INNER JOIN (
    SELECT empresa_id, mes, year, MAX(rectificada) AS max_rect
    FROM declaraciones_juradas
    WHERE year = ?
    GROUP BY empresa_id, mes, year
  ) mx
    ON mx.empresa_id = dj.empresa_id
   AND mx.mes  = dj.mes
   AND mx.year = dj.year
   AND mx.max_rect = dj.rectificada
  LEFT JOIN auxiliar a ON a.id_declaracion = dj.id
  LEFT JOIN pagos_panel pp ON pp.declaracion_jurada_id = dj.id
  WHERE dj.year = ?
`;

// Resuelve una fila cruda (DDJJ vigente + auxiliar + override) a los valores
// que consume el panel.
const resolveRow = (r) => {
  const fas = r.pp_fas != null ? num(r.pp_fas) : num(r.aux_fas);
  const solidario =
    r.pp_solidario != null ? num(r.pp_solidario) : num(r.aux_solidario);
  const sindical =
    r.pp_sindical != null ? num(r.pp_sindical) : num(r.aux_sindical);
  const intereses =
    r.pp_intereses != null ? num(r.pp_intereses) : num(r.dj_interes);

  // Total resuelto. Si no hay desglose (DDJJ legacy sin auxiliar), cae al importe.
  let total = round2(fas + solidario + sindical + intereses);
  if (total === 0 && num(r.aux_total) === 0) {
    total = num(r.importe) || num(r.subtotal);
  }

  const fecha_pago = r.pp_fecha_pago != null ? r.pp_fecha_pago : r.dj_fecha_pago;

  // El estado de pago del Panel es INDEPENDIENTE de la DDJJ: un mes cuenta como
  // "Pagado" únicamente si fue confirmado en el Panel (pagos_panel.estado_pago).
  // La aprobación de la declaración jurada (dj.estado) es un concepto aparte y no
  // se mezcla acá. Ver docs/PLAN_TECNICO (decisión de independencia de pagos).
  const pagado = Number(r.pp_estado) === 1;
  const estado = pagado ? "Pagado" : "Pendiente";

  return {
    declaracion_jurada_id: r.declaracion_jurada_id,
    empresa_id: r.empresa_id,
    mes: r.mes,
    fas,
    solidario,
    sindical,
    intereses,
    total,
    fecha_pago: fecha_pago || null,
    estado,
  };
};

const paymentsPanelModel = {
  // GET /payments-panel/grid — grilla multi-mes.
  getGrid: async ({ year, from, to, includeInactive }) => {
    const rangeFrom = from || 1;
    const rangeTo = to || 12;

    // Empresas: excluir inactivas salvo flag.
    const companiesQuery = includeInactive
      ? `SELECT id, nombre, cuit, estado FROM empresas ORDER BY nombre ASC`
      : `SELECT id, nombre, cuit, estado FROM empresas WHERE estado <> 'Inactivo' ORDER BY nombre ASC`;
    const [companies] = await pool.query(companiesQuery);

    // Filas vigentes del año.
    const [rows] = await pool.query(VIGENTES_QUERY, [year, year]);

    // Indexo por empresa -> mes -> valores resueltos.
    const byCompany = new Map();
    for (const raw of rows) {
      const r = resolveRow(raw);
      if (!byCompany.has(r.empresa_id)) byCompany.set(r.empresa_id, new Map());
      byCompany.get(r.empresa_id).set(r.mes, r);
    }

    return companies.map((c) => {
      const mesesMap = byCompany.get(c.id) || new Map();

      // Celdas del rango solicitado.
      const meses = [];
      for (let m = rangeFrom; m <= rangeTo; m++) {
        const cell = mesesMap.get(m);
        meses.push(
          cell
            ? {
                mes: m,
                monto: cell.total,
                fecha_pago: cell.fecha_pago,
                estado: cell.estado,
                declaracion_jurada_id: cell.declaracion_jurada_id,
                fas: cell.fas,
                solidario: cell.solidario,
                sindical: cell.sindical,
                intereses: cell.intereses,
              }
            : {
                mes: m,
                monto: 0,
                fecha_pago: null,
                estado: "Sin DDJJ",
                declaracion_jurada_id: null,
                fas: 0,
                solidario: 0,
                sindical: 0,
                intereses: 0,
              }
        );
      }

      // Totales sobre el año completo (no solo el rango).
      let total_anio = 0;
      let meses_pendientes = 0;
      for (const cell of mesesMap.values()) {
        if (cell.estado === "Pagado") total_anio += cell.total;
        if (cell.estado === "Pendiente") meses_pendientes += 1;
      }

      return {
        empresa_id: c.id,
        nombre: c.nombre,
        cuit: c.cuit,
        estado_empresa: c.estado,
        meses,
        total_anio: round2(total_anio),
        meses_pendientes,
      };
    });
  },

  // GET /payments-panel/summary — tarjetas de resumen (doble total + desglose).
  //
  // MES VENCIDO: los aportes se cobran a mes vencido. Parado en un mes, lo que se
  // cobra corresponde al PERÍODO del mes anterior (ej.: en julio se cobra junio).
  // Por eso "Cobrado del mes" y "Empresas pendientes" se calculan sobre el
  // período = month - 1 (con roll-over de enero -> diciembre del año anterior).
  // "Acumulado del año" sigue siendo todo lo cobrado del año en curso.
  getSummary: async ({ year, month }) => {
    // Período cobrado (mes vencido).
    const periodoMes = month === 1 ? 12 : month - 1;
    const periodoYear = month === 1 ? year - 1 : year;

    // Filas del año en curso (acumulado anual).
    const [rowsAnio] = await pool.query(VIGENTES_QUERY, [year, year]);
    // Filas del año del período cobrado (puede ser el año anterior si month=enero).
    const [rowsPeriodo] =
      periodoYear === year
        ? [rowsAnio]
        : await pool.query(VIGENTES_QUERY, [periodoYear, periodoYear]);

    const empty = () => ({ fas: 0, solidario: 0, sindical: 0, total: 0 });
    const cobrado_mes = empty();
    const acumulado_anio = empty();

    const [companies] = await pool.query(
      `SELECT COUNT(*) AS total FROM empresas WHERE estado <> 'Inactivo'`
    );
    const totalEmpresas = num(companies[0]?.total);
    const empresasPendientesMes = new Set();

    // Acumulado anual: todo lo pagado del año en curso (cualquier período).
    for (const raw of rowsAnio) {
      const r = resolveRow(raw);
      if (r.estado === "Pagado") {
        acumulado_anio.fas += r.fas;
        acumulado_anio.solidario += r.solidario;
        acumulado_anio.sindical += r.sindical;
        acumulado_anio.total += r.total;
      }
    }

    // Cobrado del mes + pendientes: sobre el período cobrado (mes vencido).
    for (const raw of rowsPeriodo) {
      const r = resolveRow(raw);
      if (r.mes !== periodoMes) continue;
      if (r.estado === "Pagado") {
        cobrado_mes.fas += r.fas;
        cobrado_mes.solidario += r.solidario;
        cobrado_mes.sindical += r.sindical;
        cobrado_mes.total += r.total;
      } else if (r.estado === "Pendiente") {
        empresasPendientesMes.add(r.empresa_id);
      }
    }

    const fmt = (o) => ({
      fas: round2(o.fas),
      solidario: round2(o.solidario),
      sindical: round2(o.sindical),
      total: round2(o.total),
    });

    return {
      cobrado_mes: fmt(cobrado_mes),
      acumulado_anio: fmt(acumulado_anio),
      empresas_pendientes: {
        pendientes: empresasPendientesMes.size,
        total: totalEmpresas,
      },
      // Período efectivamente cobrado (para rotular las tarjetas en el front).
      periodo: { mes: periodoMes, year: periodoYear },
    };
  },

  // GET /payments-panel/company/:idCompany — detalle de empresa.
  getCompanyDetail: async ({ idCompany, year }) => {
    const [empresa] = await pool.query(
      `SELECT id, nombre, cuit FROM empresas WHERE id = ?`,
      [idCompany]
    );
    if (!empresa.length) return null;

    const [rows] = await pool.query(
      `${VIGENTES_QUERY} AND dj.empresa_id = ? ORDER BY dj.mes ASC`,
      [year, year, idCompany]
    );

    const totales = { fas: 0, solidario: 0, sindical: 0, intereses: 0 };
    let total_pagado_anio = 0;
    let meses_pendientes = 0;
    const historial = [];

    for (const raw of rows) {
      const r = resolveRow(raw);
      historial.push({
        mes: r.mes,
        importe_total: r.total,
        fas: r.fas,
        solidario: r.solidario,
        sindical: r.sindical,
        intereses: r.intereses,
        fecha_pago: r.fecha_pago,
        estado: r.estado,
        declaracion_jurada_id: r.declaracion_jurada_id,
      });
      if (r.estado === "Pagado") {
        total_pagado_anio += r.total;
        totales.fas += r.fas;
        totales.solidario += r.solidario;
        totales.sindical += r.sindical;
        totales.intereses += r.intereses;
      }
      if (r.estado === "Pendiente") meses_pendientes += 1;
    }

    return {
      header: {
        nombre: empresa[0].nombre,
        cuit: empresa[0].cuit,
        total_pagado_anio: round2(total_pagado_anio),
        totales: {
          fas: round2(totales.fas),
          solidario: round2(totales.solidario),
          sindical: round2(totales.sindical),
          intereses: round2(totales.intereses),
        },
        meses_pendientes,
      },
      historial,
    };
  },

  // GET /payments-panel/proposal/:idCompany/:year/:month — propuesta para confirmar pago.
  getProposal: async ({ idCompany, year, month }) => {
    const [rows] = await pool.query(
      `${VIGENTES_QUERY} AND dj.empresa_id = ? AND dj.mes = ? LIMIT 1`,
      [year, year, idCompany, month]
    );

    if (!rows.length) {
      return {
        declaracion_jurada_id: null,
        fas: 0,
        solidario: 0,
        sindical: 0,
        subtotal: 0,
        estado: "Sin DDJJ",
      };
    }

    const r = resolveRow(rows[0]);
    return {
      declaracion_jurada_id: r.declaracion_jurada_id,
      fas: r.fas,
      solidario: r.solidario,
      sindical: r.sindical,
      subtotal: num(rows[0].subtotal) || round2(r.fas + r.solidario + r.sindical),
      estado: r.estado,
    };
  },

  // POST /payments-panel/interest/preview — interés sin persistir.
  previewInterest: async ({ declaracion_jurada_id, fecha_pago }) => {
    const [dj] = await pool.query(
      `SELECT subtotal, importe, mes, year FROM declaraciones_juradas WHERE id = ?`,
      [declaracion_jurada_id]
    );
    if (!dj.length) throw new Error("Declaración jurada no encontrada");

    const [tasa] = await pool.query(`SELECT porcentaje FROM tasa LIMIT 1`);
    const porcentaje = num(tasa[0]?.porcentaje);
    const subtotal = num(dj[0].subtotal) || num(dj[0].importe);

    return calcInterest({
      subtotal,
      mes: dj[0].mes,
      year: dj[0].year,
      fechaPago: fecha_pago,
      porcentaje,
    });
  },

  // PUT /payments-panel/payment — upsert de override en pagos_panel (no confirma).
  upsertPayment: async (payload) => {
    const {
      declaracion_jurada_id,
      fecha_pago,
      importe_fas,
      importe_solidario,
      importe_sindical,
      importe_intereses,
      observaciones,
      usuario_carga,
    } = payload;

    if (!declaracion_jurada_id) {
      throw new Error("declaracion_jurada_id es requerido");
    }

    // DDJJ vigente + desglose para resolver defaults.
    const [dj] = await pool.query(
      `SELECT dj.empresa_id, dj.mes, dj.year, dj.subtotal, dj.importe,
              a.fas, a.solidario, a.sindical
       FROM declaraciones_juradas dj
       LEFT JOIN auxiliar a ON a.id_declaracion = dj.id
       WHERE dj.id = ?`,
      [declaracion_jurada_id]
    );
    if (!dj.length) throw new Error("Declaración jurada no encontrada");

    // No permitir editar un pago ya confirmado (solo lectura).
    const [existing] = await pool.query(
      `SELECT id, estado_pago FROM pagos_panel WHERE declaracion_jurada_id = ?`,
      [declaracion_jurada_id]
    );
    if (existing.length && Number(existing[0].estado_pago) === 1) {
      throw new Error("El pago ya está confirmado y es de solo lectura");
    }

    // Intereses: autocalcular si no vienen y hay fecha de pago.
    let intereses = importe_intereses;
    if ((intereses === undefined || intereses === null || intereses === "") && fecha_pago) {
      const [tasa] = await pool.query(`SELECT porcentaje FROM tasa LIMIT 1`);
      const subtotal = num(dj[0].subtotal) || num(dj[0].importe);
      const calc = calcInterest({
        subtotal,
        mes: dj[0].mes,
        year: dj[0].year,
        fechaPago: fecha_pago,
        porcentaje: num(tasa[0]?.porcentaje),
      });
      intereses = calc.interes;
    }
    intereses = num(intereses);

    // Valores resueltos (override o propuesta de la DDJJ) para cachear el total.
    const fas = importe_fas != null && importe_fas !== "" ? num(importe_fas) : num(dj[0].fas);
    const solidario =
      importe_solidario != null && importe_solidario !== "" ? num(importe_solidario) : num(dj[0].solidario);
    const sindical =
      importe_sindical != null && importe_sindical !== "" ? num(importe_sindical) : num(dj[0].sindical);
    const total = round2(fas + solidario + sindical + intereses);

    const params = [
      declaracion_jurada_id,
      dj[0].empresa_id,
      dj[0].mes,
      dj[0].year,
      fecha_pago || null,
      importe_fas != null && importe_fas !== "" ? num(importe_fas) : null,
      importe_solidario != null && importe_solidario !== "" ? num(importe_solidario) : null,
      importe_sindical != null && importe_sindical !== "" ? num(importe_sindical) : null,
      intereses,
      total,
      observaciones || null,
      usuario_carga || null,
    ];

    const query = `
      INSERT INTO pagos_panel
        (declaracion_jurada_id, empresa_id, mes, year, fecha_pago,
         importe_fas, importe_solidario, importe_sindical, importe_intereses,
         total, observaciones, usuario_carga, created, modified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        fecha_pago = VALUES(fecha_pago),
        importe_fas = VALUES(importe_fas),
        importe_solidario = VALUES(importe_solidario),
        importe_sindical = VALUES(importe_sindical),
        importe_intereses = VALUES(importe_intereses),
        total = VALUES(total),
        observaciones = VALUES(observaciones),
        usuario_carga = VALUES(usuario_carga),
        modified = NOW()
    `;
    await pool.query(query, params);

    const [saved] = await pool.query(
      `SELECT * FROM pagos_panel WHERE declaracion_jurada_id = ?`,
      [declaracion_jurada_id]
    );
    return saved[0];
  },

  // GET /payments-panel/companies-management — listado para el modal de gestión.
  // Devuelve TODAS las empresas con su cantidad de declaraciones adeudadas
  // (DDJJ vigentes sin pagar) en la ventana [lo, hi] expresada como year*12 + (mes-1).
  // Ordenadas por adeudadas DESC (peores deudores arriba), luego alfabético.
  getCompaniesManagement: async ({ lo, hi }) => {
    const query = `
      SELECT e.id, e.nombre, e.cuit, e.estado,
             COALESCE(v.adeudadas, 0) AS adeudadas
      FROM empresas e
      LEFT JOIN (
        SELECT dj.empresa_id,
               SUM(
                 CASE WHEN dj.estado <> 3
                       AND (pp.estado_pago IS NULL OR pp.estado_pago = 0)
                      THEN 1 ELSE 0 END
               ) AS adeudadas
        FROM declaraciones_juradas dj
        INNER JOIN (
          SELECT empresa_id, mes, year, MAX(rectificada) AS mr
          FROM declaraciones_juradas
          WHERE (year * 12 + mes - 1) BETWEEN ? AND ?
          GROUP BY empresa_id, mes, year
        ) mx
          ON mx.empresa_id = dj.empresa_id
         AND mx.mes = dj.mes
         AND mx.year = dj.year
         AND mx.mr = dj.rectificada
        LEFT JOIN pagos_panel pp ON pp.declaracion_jurada_id = dj.id
        WHERE (dj.year * 12 + dj.mes - 1) BETWEEN ? AND ?
        GROUP BY dj.empresa_id
      ) v ON v.empresa_id = e.id
      ORDER BY adeudadas DESC, e.nombre ASC
    `;
    const [rows] = await pool.query(query, [lo, hi, lo, hi]);
    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      cuit: r.cuit,
      estado: r.estado,
      adeudadas: num(r.adeudadas),
    }));
  },

  // POST /payments-panel/payment/:id/confirm — estado_pago = 1 (solo lectura luego).
  // :id = pagos_panel.id
  confirmPayment: async (id) => {
    const [result] = await pool.query(
      `UPDATE pagos_panel SET estado_pago = 1, modified = NOW() WHERE id = ?`,
      [id]
    );
    if (result.affectedRows === 0) throw new Error("Registro de pago no encontrado");
    const [saved] = await pool.query(`SELECT * FROM pagos_panel WHERE id = ?`, [id]);
    return saved[0];
  },
};

export default paymentsPanelModel;
