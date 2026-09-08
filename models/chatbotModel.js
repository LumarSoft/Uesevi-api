import { pool } from "../db/db.js";

// Sub-consulta reutilizable: se queda con la rectificación vigente de cada
// período (la de mayor `rectificada`). Ver CLAUDE.md — omitirla es el bug
// clásico: períodos duplicados y totales mal calculados.
const JOIN_VIGENTE = `
  INNER JOIN (
    SELECT empresa_id, mes, year, MAX(rectificada) AS max_rectificada
    FROM declaraciones_juradas
    GROUP BY empresa_id, mes, year
  ) mx ON mx.empresa_id = dj.empresa_id AND mx.mes = dj.mes
      AND mx.year = dj.year AND mx.max_rectificada = dj.rectificada
`;

const ESTADO_DDJJ = {
  0: "Pendiente de pago",
  1: "Pagada / aprobada",
  2: "Pago parcial",
  3: "Rectificada (reemplazada)",
};

const describirEstado = (estado) =>
  ESTADO_DDJJ[estado] ?? `Desconocido (${estado})`;

// CUIT y CUIL están cargados con y sin guiones; para buscar normalizamos ambos lados.
const soloDigitos = (texto) => String(texto ?? "").replace(/\D/g, "");

// ---------------------------------------------------------------------------
// Tablas y columnas visibles para la herramienta de SQL libre de solo lectura.
// Todo lo que no esté acá se rechaza antes de tocar la base.
// ---------------------------------------------------------------------------
export const TABLAS_PERMITIDAS = [
  "empresas",
  "empleados",
  "contratos",
  "usuarios",
  "declaraciones_juradas",
  "sueldos",
  "auxiliar",
  "categorias",
  "tasa",
  "pagos_panel",
  "noticias",
  "consultas",
  "inscripcion",
  "estados",
];

// Columnas sensibles: nunca se devuelven ni se pueden nombrar en una consulta.
export const COLUMNAS_PROHIBIDAS = ["password", "hash", "caducidad"];

const chatbotModel = {
  // -------------------------------------------------------------------------
  // Lecturas
  // -------------------------------------------------------------------------
  searchCompanies: async ({ texto = "", estado = null, limit = 15 }) => {
    const like = `%${texto}%`;
    // Los CUIT están cargados con y sin guiones: comparamos sólo los dígitos.
    const likeDigitos = `%${soloDigitos(texto)}%`;
    const filtroEstado = estado ? "AND e.estado = ?" : "";
    const params = [like, like, likeDigitos, like];
    if (estado) params.push(estado);
    params.push(limit);

    const query = `
      SELECT e.id, e.cuit, e.nombre, e.email_contacto, e.telefono,
             e.domicilio, e.ciudad, e.estado, u.email AS email_usuario
      FROM empresas e
      LEFT JOIN usuarios u ON u.id = e.usuario_id
      WHERE (e.nombre LIKE ? OR e.email_contacto LIKE ?
             OR REPLACE(REPLACE(e.cuit, '-', ''), ' ', '') LIKE ? OR u.email LIKE ?)
        ${filtroEstado}
      ORDER BY e.nombre ASC
      LIMIT ?;
    `;
    const [rows] = await pool.query(query, params);
    return rows;
  },

  getCompany: async (id) => {
    const query = `
      SELECT e.id, e.cuit, e.nombre, e.email_contacto, e.telefono, e.domicilio,
             e.ciudad, e.numero_agencia, e.estado, e.created AS fecha_alta,
             u.id AS usuario_id, u.email AS email_usuario, u.estado AS estado_usuario
      FROM empresas e
      LEFT JOIN usuarios u ON u.id = e.usuario_id
      WHERE e.id = ?;
    `;
    const [rows] = await pool.query(query, [id]);
    if (!rows.length) return null;

    const [[conteo]] = await pool.query(
      `SELECT COUNT(DISTINCT c.empleado_id) AS empleados_activos
       FROM contratos c
       WHERE c.empresa_id = ? AND c.deleted IS NULL AND c.estado = '1';`,
      [id]
    );

    return { ...rows[0], empleados_activos: conteo.empleados_activos };
  },

  lastStatement: async (empresaId) => {
    const query = `
      SELECT dj.id, dj.mes, dj.year, dj.rectificada, dj.fecha AS fecha_carga,
             dj.subtotal, dj.interes, dj.importe, dj.vencimiento,
             dj.fecha_pago, dj.pago_parcial, dj.estado
      FROM declaraciones_juradas dj
      ${JOIN_VIGENTE}
      WHERE dj.empresa_id = ?
      ORDER BY dj.year DESC, dj.mes DESC
      LIMIT 1;
    `;
    const [rows] = await pool.query(query, [empresaId]);
    if (!rows.length) return null;
    return { ...rows[0], estado_descripcion: describirEstado(rows[0].estado) };
  },

  listStatements: async ({ empresaId, year = null, mes = null, estado = null, limit = 24 }) => {
    const condiciones = ["dj.empresa_id = ?"];
    const params = [empresaId];
    if (year !== null) {
      condiciones.push("dj.year = ?");
      params.push(year);
    }
    if (mes !== null) {
      condiciones.push("dj.mes = ?");
      params.push(mes);
    }
    if (estado !== null) {
      condiciones.push("dj.estado = ?");
      params.push(estado);
    }
    params.push(limit);

    const query = `
      SELECT dj.id, dj.mes, dj.year, dj.rectificada, dj.fecha AS fecha_carga,
             dj.subtotal, dj.interes, dj.importe, dj.vencimiento,
             dj.fecha_pago, dj.pago_parcial, dj.estado,
             (SELECT COUNT(*) FROM sueldos s WHERE s.declaraciones_jurada_id = dj.id) AS empleados_declarados
      FROM declaraciones_juradas dj
      ${JOIN_VIGENTE}
      WHERE ${condiciones.join(" AND ")}
      ORDER BY dj.year DESC, dj.mes DESC
      LIMIT ?;
    `;
    const [rows] = await pool.query(query, params);
    return rows.map((r) => ({ ...r, estado_descripcion: describirEstado(r.estado) }));
  },

  // Períodos sin DDJJ entre la primera declaración de la empresa y el mes pasado.
  missingPeriods: async (empresaId) => {
    const [rows] = await pool.query(
      `SELECT DISTINCT dj.mes, dj.year
       FROM declaraciones_juradas dj
       WHERE dj.empresa_id = ?
       ORDER BY dj.year ASC, dj.mes ASC;`,
      [empresaId]
    );
    if (!rows.length) return { faltantes: [], desde: null, hasta: null };

    const presentes = new Set(rows.map((r) => `${r.year}-${r.mes}`));
    const primero = rows[0];

    const hoy = new Date();
    // El período corriente todavía no vence, se controla hasta el mes anterior.
    let hastaYear = hoy.getFullYear();
    let hastaMes = hoy.getMonth(); // getMonth() es 0-11, o sea el mes anterior en base 1
    if (hastaMes === 0) {
      hastaMes = 12;
      hastaYear -= 1;
    }

    const faltantes = [];
    let year = primero.year;
    let mes = primero.mes;
    while (year < hastaYear || (year === hastaYear && mes <= hastaMes)) {
      if (!presentes.has(`${year}-${mes}`)) faltantes.push({ mes, year });
      mes += 1;
      if (mes > 12) {
        mes = 1;
        year += 1;
      }
    }

    return {
      faltantes,
      desde: { mes: primero.mes, year: primero.year },
      hasta: { mes: hastaMes, year: hastaYear },
    };
  },

  searchEmployees: async ({ texto = "", limit = 15 }) => {
    const like = `%${texto}%`;
    // Los CUIL conviven con y sin guiones en la base: comparamos sólo dígitos.
    const likeDigitos = `%${soloDigitos(texto)}%`;
    const query = `
      SELECT emp.id, emp.cuil, emp.numero_socio, emp.sindicato_activo,
             emp.categoria_id, cat.nombre AS categoria,
             u.nombre, u.apellido, u.email, u.telefono,
             c.id AS contrato_id, c.puesto, c.fecha_ingreso, c.estado AS estado_contrato,
             e.id AS empresa_id, e.nombre AS empresa, e.cuit AS cuit_empresa
      FROM empleados emp
      LEFT JOIN usuarios u ON u.id = emp.usuario_id
      LEFT JOIN categorias cat ON cat.id = emp.categoria_id
      LEFT JOIN contratos c ON c.empleado_id = emp.id AND c.deleted IS NULL AND c.estado = '1'
      LEFT JOIN empresas e ON e.id = c.empresa_id
      WHERE REPLACE(REPLACE(emp.cuil, '-', ''), ' ', '') LIKE ?
         OR u.nombre LIKE ? OR u.apellido LIKE ?
         OR CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, '')) LIKE ?
         OR u.email LIKE ?
      ORDER BY u.apellido ASC, u.nombre ASC
      LIMIT ?;
    `;
    const [rows] = await pool.query(query, [likeDigitos, like, like, like, like, limit]);
    return rows;
  },

  listCompanyEmployees: async ({ empresaId, soloActivos = true, limit = 100 }) => {
    const filtro = soloActivos ? "AND c.deleted IS NULL AND c.estado = '1'" : "";
    const query = `
      SELECT emp.id, emp.cuil, emp.sindicato_activo, cat.nombre AS categoria,
             u.nombre, u.apellido, u.email,
             c.puesto, c.fecha_ingreso, c.estado AS estado_contrato
      FROM contratos c
      INNER JOIN empleados emp ON emp.id = c.empleado_id
      LEFT JOIN usuarios u ON u.id = emp.usuario_id
      LEFT JOIN categorias cat ON cat.id = emp.categoria_id
      WHERE c.empresa_id = ? ${filtro}
      ORDER BY u.apellido ASC, u.nombre ASC
      LIMIT ?;
    `;
    const [rows] = await pool.query(query, [empresaId, limit]);
    return rows;
  },

  // Empresas con DDJJ vigentes impagas (estado 0 o 2) y vencidas.
  debtorCompanies: async ({ limit = 20 }) => {
    const query = `
      SELECT e.id, e.nombre, e.cuit, e.email_contacto,
             COUNT(*) AS periodos_impagos,
             SUM(dj.importe - COALESCE(dj.pago_parcial, 0)) AS deuda_aproximada,
             MIN(CONCAT(dj.year, '-', LPAD(dj.mes, 2, '0'))) AS periodo_mas_viejo
      FROM declaraciones_juradas dj
      ${JOIN_VIGENTE}
      INNER JOIN empresas e ON e.id = dj.empresa_id
      WHERE dj.estado IN (0, 2) AND dj.vencimiento < CURDATE()
      GROUP BY e.id, e.nombre, e.cuit, e.email_contacto
      ORDER BY deuda_aproximada DESC
      LIMIT ?;
    `;
    const [rows] = await pool.query(query, [limit]);
    return rows;
  },

  listCategories: async () => {
    const [rows] = await pool.query(
      `SELECT id, nombre, sueldo_basico, presentismo, sueldo_futuro, fecha_vigencia,
              presentismo_futuro, fecha_vigencia_presentismo
       FROM categorias ORDER BY id ASC;`
    );
    return rows;
  },

  getRate: async () => {
    const [rows] = await pool.query(
      `SELECT id, porcentaje, modified FROM tasa ORDER BY id ASC LIMIT 1;`
    );
    return rows[0] ?? null;
  },

  generalStats: async () => {
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM empresas WHERE estado = 'Activo') AS empresas_activas,
        (SELECT COUNT(*) FROM empresas WHERE estado = 'Pendiente') AS empresas_pendientes,
        (SELECT COUNT(DISTINCT c.empleado_id) FROM contratos c
           INNER JOIN empresas e ON e.id = c.empresa_id
          WHERE c.deleted IS NULL AND c.estado = '1' AND e.estado = 'Activo') AS empleados_activos,
        (SELECT COUNT(DISTINCT c.empleado_id) FROM contratos c
           INNER JOIN empleados emp ON emp.id = c.empleado_id
           INNER JOIN empresas e ON e.id = c.empresa_id
          WHERE c.deleted IS NULL AND c.estado = '1' AND e.estado = 'Activo'
            AND emp.sindicato_activo = 1) AS empleados_afiliados,
        (SELECT COUNT(*) FROM declaraciones_juradas) AS declaraciones_totales;
    `);
    return stats;
  },

  // SQL libre de solo lectura. La validación vive en utils/chatbotSql.js;
  // acá sólo se ejecuta con un LIMIT ya garantizado por el validador.
  runReadOnlyQuery: async (sql) => {
    const connection = await pool.getConnection();
    try {
      // La sesión queda en solo lectura: aunque algo se escape del validador,
      // MySQL rechaza cualquier escritura.
      await connection.query("SET SESSION TRANSACTION READ ONLY;");
      await connection.beginTransaction();
      const [rows] = await connection.query(sql);
      await connection.rollback();
      return rows;
    } finally {
      // Devolvemos la sesión a su modo normal antes de soltarla al pool.
      try {
        await connection.query("SET SESSION TRANSACTION READ WRITE;");
      } catch (_) {
        /* la conexión se descarta igual */
      }
      connection.release();
    }
  },

  // -------------------------------------------------------------------------
  // Escrituras — sólo se llaman desde la confirmación explícita del admin
  // -------------------------------------------------------------------------
  updateCompany: async (id, campos) => {
    const columnas = Object.keys(campos);
    if (!columnas.length) return 0;
    const sets = columnas.map((c) => `\`${c}\` = ?`).join(", ");
    const [res] = await pool.query(
      `UPDATE empresas SET ${sets}, modified = NOW() WHERE id = ?;`,
      [...columnas.map((c) => campos[c]), id]
    );
    return res.affectedRows;
  },

  updateRate: async (id, porcentaje) => {
    const [res] = await pool.query(
      `UPDATE tasa SET porcentaje = ?, modified = NOW() WHERE id = ?;`,
      [porcentaje, id]
    );
    return res.affectedRows;
  },

  updateCategory: async (id, campos) => {
    const columnas = Object.keys(campos);
    if (!columnas.length) return 0;
    const sets = columnas.map((c) => `\`${c}\` = ?`).join(", ");
    const [res] = await pool.query(
      `UPDATE categorias SET ${sets}, modified = NOW() WHERE id = ?;`,
      [...columnas.map((c) => campos[c]), id]
    );
    return res.affectedRows;
  },

  updateEmployee: async (id, campos) => {
    const columnas = Object.keys(campos);
    if (!columnas.length) return 0;
    const sets = columnas.map((c) => `\`${c}\` = ?`).join(", ");
    const [res] = await pool.query(
      `UPDATE empleados SET ${sets} WHERE id = ?;`,
      [...columnas.map((c) => campos[c]), id]
    );
    return res.affectedRows;
  },

  getCategory: async (id) => {
    const [rows] = await pool.query(
      `SELECT id, nombre, sueldo_basico, presentismo FROM categorias WHERE id = ?;`,
      [id]
    );
    return rows[0] ?? null;
  },

  getEmployee: async (id) => {
    const [rows] = await pool.query(
      `SELECT emp.id, emp.cuil, emp.sindicato_activo, emp.categoria_id,
              u.nombre, u.apellido, u.email
       FROM empleados emp
       LEFT JOIN usuarios u ON u.id = emp.usuario_id
       WHERE emp.id = ?;`,
      [id]
    );
    return rows[0] ?? null;
  },
};

export { describirEstado };
export default chatbotModel;
