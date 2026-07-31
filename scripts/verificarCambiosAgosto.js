/**
 * Verificación end-to-end de los cambios de agosto 2026.
 *
 * Corre contra la base REAL y comprueba, en un solo paso, todo lo que tocamos:
 *   1. Migraciones aplicadas
 *   2. Categorías: presentismo y aporte solidario resultante
 *   3. Programación de valores futuros + promoción por vigencia (el "update-now")
 *   4. Declaraciones: que el detalle por empleado SUME el total declarado
 *   5. Panel de Pagos: duplicados, índice único y aplica_interes
 *
 * USO
 *   node scripts/verificarCambiosAgosto.js              # sólo lectura, no toca nada
 *   node scripts/verificarCambiosAgosto.js --promover   # además ejecuta la promoción
 *                                                       # (equivale a GET /category/update-now)
 *
 * Salvo con --promover, el script NO escribe en la base.
 */

import { pool } from "../db/db.js";
import categoryModel from "../models/categoryModel.js";

const PROMOVER = process.argv.includes("--promover");

const money = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(n) || 0
  );
const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round(Number(n) * 100) / 100;

let fallos = 0;
let avisos = 0;
const ok = (m) => console.log(`  ✅ ${m}`);
const bad = (m) => {
  fallos++;
  console.log(`  ❌ ${m}`);
};
const warn = (m) => {
  avisos++;
  console.log(`  ⚠️  ${m}`);
};
const titulo = (t) => console.log(`\n${"═".repeat(72)}\n${t}\n${"═".repeat(72)}`);

// Réplica de shared/utils/aportes.ts — si cambia allá, cambiar acá.
const FORMULA_NUEVA_DESDE = new Date("2026-07-01T00:00:00");
const aporteSolidario = (s, fechaCarga) => {
  if (Number(s.sindicato_activo) === 1) return 0;
  const cargadaConFormulaNueva =
    !fechaCarga || new Date(fechaCarga) >= FORMULA_NUEVA_DESDE;
  if (cargadaConFormulaNueva) {
    return (num(s.sueldo_basico) + num(s.presentismo)) * 0.02;
  }
  return (
    (num(s.monto) + num(s.adicional_norem) + num(s.remunerativo_adicional)) *
    0.02
  );
};

const columnas = async (tabla) => {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME AS c FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tabla]
  );
  return new Set(rows.map((r) => r.c));
};

// ---------------------------------------------------------------- 1. Esquema
const verificarEsquema = async () => {
  titulo("1. MIGRACIONES");
  const req = {
    categorias: ["presentismo", "presentismo_futuro", "fecha_vigencia_presentismo"],
    sueldos: ["presentismo"],
    pagos_panel: ["aplica_interes"],
  };
  let completo = true;
  for (const [tabla, cols] of Object.entries(req)) {
    const existentes = await columnas(tabla);
    for (const c of cols) {
      if (existentes.has(c)) ok(`${tabla}.${c}`);
      else {
        bad(`FALTA ${tabla}.${c} — hay una migración sin correr`);
        completo = false;
      }
    }
  }
  const [idx] = await pool.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pagos_panel'
        AND INDEX_NAME = 'uq_pagos_panel_ddjj' LIMIT 1`
  );
  if (idx.length) ok("índice único pagos_panel.uq_pagos_panel_ddjj");
  else warn("falta uq_pagos_panel_ddjj (2026_08_fix_pagos_panel_duplicados.sql)");
  return completo;
};

// ------------------------------------------------------------ 2. Categorías
const verificarCategorias = async () => {
  titulo("2. CATEGORÍAS — presentismo y aporte solidario");
  const [cats] = await pool.query(
    `SELECT id, nombre, sueldo_basico, presentismo,
            sueldo_futuro, fecha_vigencia,
            presentismo_futuro, fecha_vigencia_presentismo
       FROM categorias ORDER BY id`
  );
  console.table(
    cats.map((c) => ({
      id: c.id,
      categoría: c.nombre.slice(0, 34),
      básico: money(c.sueldo_basico),
      presentismo: c.presentismo == null ? "— sin cargar —" : money(c.presentismo),
      "aporte 2%": money((num(c.sueldo_basico) + num(c.presentismo)) * 0.02),
    }))
  );

  const sinPresentismo = cats.filter((c) => c.presentismo == null);
  if (sinPresentismo.length === 0) ok("todas las categorías tienen presentismo cargado");
  else
    warn(
      `${sinPresentismo.length} categoría(s) sin presentismo (calculan 2% sólo del básico): ` +
        sinPresentismo.map((c) => c.nombre).join(", ")
    );

  // Mismo básico + mismo presentismo => mismo aporte. Si no, hay error de carga.
  const porClave = new Map();
  for (const c of cats) {
    const k = `${num(c.sueldo_basico)}|${num(c.presentismo)}`;
    if (!porClave.has(k)) porClave.set(k, []);
    porClave.get(k).push(c.nombre);
  }
  ok(
    `consistencia: ${porClave.size} combinación(es) distintas de básico+presentismo ` +
      `para ${cats.length} categorías`
  );
  return cats;
};

// -------------------------------------------- 3. Programación y promoción
const verificarProgramacion = async (cats) => {
  titulo("3. VALORES PROGRAMADOS Y PROMOCIÓN (el 'update-now')");
  const ahora = new Date();
  const pend = cats.filter(
    (c) =>
      (c.sueldo_futuro != null && c.fecha_vigencia) ||
      (c.presentismo_futuro != null && c.fecha_vigencia_presentismo)
  );

  if (!pend.length) {
    console.log("  (no hay nada programado)");
    return;
  }

  console.table(
    pend.map((c) => ({
      categoría: c.nombre.slice(0, 30),
      "sueldo fut.": c.sueldo_futuro == null ? "—" : money(c.sueldo_futuro),
      "vig. sueldo": c.fecha_vigencia
        ? new Date(c.fecha_vigencia).toLocaleString("es-AR")
        : "—",
      "presen. fut.": c.presentismo_futuro == null ? "—" : money(c.presentismo_futuro),
      "vig. presen.": c.fecha_vigencia_presentismo
        ? new Date(c.fecha_vigencia_presentismo).toLocaleString("es-AR")
        : "—",
      "¿promueve ya?":
        (c.fecha_vigencia && new Date(c.fecha_vigencia) <= ahora ? "sueldo " : "") +
          (c.fecha_vigencia_presentismo &&
          new Date(c.fecha_vigencia_presentismo) <= ahora
            ? "presentismo"
            : "") || "no, es futura",
    }))
  );

  if (!PROMOVER) {
    console.log("\n  (simulacro — volvé a correr con --promover para ejecutarla)");
    return;
  }

  console.log("\n  Ejecutando categoryModel.updateNow()…");
  const r = await categoryModel.updateNow();
  console.log(
    `  → ${r.sueldosActualizados} sueldo(s) básico(s) y ` +
      `${r.presentismosActualizados} presentismo(s) promovidos.`
  );

  const [despues] = await pool.query(
    `SELECT id, nombre, sueldo_basico, presentismo, sueldo_futuro,
            presentismo_futuro, fecha_vigencia, fecha_vigencia_presentismo
       FROM categorias WHERE id IN (?)`,
    [pend.map((c) => c.id)]
  );
  for (const d of despues) {
    const antes = pend.find((c) => c.id === d.id);
    if (
      antes.presentismo_futuro != null &&
      antes.fecha_vigencia_presentismo &&
      new Date(antes.fecha_vigencia_presentismo) <= ahora
    ) {
      const promovido =
        num(d.presentismo) === num(antes.presentismo_futuro) &&
        d.presentismo_futuro === null &&
        d.fecha_vigencia_presentismo === null;
      promovido
        ? ok(
            `${d.nombre}: presentismo ${money(antes.presentismo)} → ${money(d.presentismo)}, ` +
              `y el futuro quedó limpio`
          )
        : bad(`${d.nombre}: el presentismo NO se promovió correctamente`);
    }
    if (
      antes.sueldo_futuro != null &&
      antes.fecha_vigencia &&
      new Date(antes.fecha_vigencia) <= ahora
    ) {
      const promovido =
        num(d.sueldo_basico) === num(antes.sueldo_futuro) &&
        d.sueldo_futuro === null;
      promovido
        ? ok(`${d.nombre}: sueldo básico → ${money(d.sueldo_basico)}, futuro limpio`)
        : bad(`${d.nombre}: el sueldo básico NO se promovió correctamente`);
    }
  }

  const r2run = await categoryModel.updateNow();
  r2run.affectedRows === 0
    ? ok("idempotente: una segunda corrida no promueve nada")
    : bad(`segunda corrida promovió ${r2run.affectedRows} más (no es idempotente)`);
};

// --------------------------------- 4. Declaraciones: detalle vs total declarado
const verificarDeclaraciones = async (limite = 25) => {
  titulo("4. DECLARACIONES — ¿el detalle por empleado suma el total declarado?");
  const [djs] = await pool.query(
    `SELECT dj.id, dj.mes, dj.year, dj.fecha AS fecha_carga, dj.rectificada,
            e.nombre AS empresa, a.solidario AS solidario_declarado
       FROM declaraciones_juradas dj
       INNER JOIN empresas e ON e.id = dj.empresa_id
       INNER JOIN auxiliar a
         ON a.id = (SELECT MAX(a2.id) FROM auxiliar a2 WHERE a2.id_declaracion = dj.id)
      ORDER BY dj.id DESC
      LIMIT ?`,
    [limite]
  );

  if (!djs.length) {
    warn("no hay declaraciones con desglose para verificar");
    return;
  }

  const filas = [];
  for (const dj of djs) {
    const [sueldos] = await pool.query(
      `SELECT sindicato_activo, sueldo_basico, presentismo, monto,
              adicional_norem, remunerativo_adicional
         FROM sueldos WHERE declaraciones_jurada_id = ?`,
      [dj.id]
    );
    const suma = r2(
      sueldos.reduce((acc, s) => acc + aporteSolidario(s, dj.fecha_carga), 0)
    );
    const declarado = r2(num(dj.solidario_declarado));
    const dif = r2(suma - declarado);
    const cierra = Math.abs(dif) <= 1;
    if (!cierra) fallos++;
    filas.push({
      DDJJ: dj.id,
      empresa: (dj.empresa || "").slice(0, 22),
      período: `${dj.mes}/${dj.year}`,
      cargada: dj.fecha_carga
        ? new Date(dj.fecha_carga).toLocaleDateString("es-AR")
        : "—",
      empleados: sueldos.length,
      "suma detalle": money(suma),
      declarado: money(declarado),
      "": cierra ? "OK" : `✗ dif ${money(dif)}`,
    });
  }
  console.table(filas);
  const malas = filas.filter((f) => f[""] !== "OK").length;
  malas === 0
    ? ok(`las ${filas.length} declaraciones revisadas cierran contra su total declarado`)
    : bad(`${malas} de ${filas.length} NO cierran — el detalle no suma el total`);
};

// ------------------------------------------------------- 5. Panel de Pagos
const verificarPanelPagos = async () => {
  titulo("5. PANEL DE PAGOS");
  const [dups] = await pool.query(
    `SELECT declaracion_jurada_id, COUNT(*) AS filas
       FROM pagos_panel GROUP BY declaracion_jurada_id HAVING COUNT(*) > 1`
  );
  dups.length === 0
    ? ok("sin filas duplicadas en pagos_panel")
    : bad(
        `${dups.length} declaración(es) con filas duplicadas — correr ` +
          `2026_08_fix_pagos_panel_duplicados.sql`
      );

  const cols = await columnas("pagos_panel");
  if (!cols.has("aplica_interes")) return;

  const [est] = await pool.query(
    `SELECT estado_pago, aplica_interes, COUNT(*) AS n,
            SUM(COALESCE(importe_intereses,0) > 0) AS con_interes
       FROM pagos_panel GROUP BY estado_pago, aplica_interes ORDER BY estado_pago`
  );
  console.table(
    est.map((e) => ({
      estado: Number(e.estado_pago) === 1 ? "Pagado" : "Pendiente",
      "aplica interés": Number(e.aplica_interes) === 1 ? "sí" : "no",
      registros: e.n,
      "con interés > 0": e.con_interes,
    }))
  );

  const [incoh] = await pool.query(
    `SELECT COUNT(*) AS n FROM pagos_panel
      WHERE aplica_interes = 0 AND COALESCE(importe_intereses, 0) <> 0`
  );
  num(incoh[0].n) === 0
    ? ok("ningún pago con 'no aplica interés' tiene interés cargado")
    : warn(
        `${incoh[0].n} pago(s) con aplica_interes = 0 pero interés distinto de 0 ` +
          `(quedaron de antes del cambio; se corrigen al volver a guardarlos)`
      );
};

// ---------------------------------------------------------------------------
const main = async () => {
  console.log(
    `\nVerificación de los cambios de agosto 2026 — ${new Date().toLocaleString("es-AR")}`
  );
  console.log(PROMOVER ? "MODO: promoción ACTIVADA (escribe en la base)" : "MODO: sólo lectura");

  const esquemaOk = await verificarEsquema();
  if (!esquemaOk) {
    console.log(
      "\n⛔ Faltan migraciones. Corrán las de db/migrations/ y volvé a ejecutar esto.\n"
    );
    await pool.end();
    process.exit(1);
  }

  const cats = await verificarCategorias();
  await verificarProgramacion(cats);
  await verificarDeclaraciones();
  await verificarPanelPagos();

  titulo("RESULTADO");
  console.log(`  ${fallos} fallo(s), ${avisos} aviso(s).`);
  console.log(
    fallos === 0
      ? "  ✅ Todo en orden.\n"
      : "  ❌ Revisar los puntos marcados con ❌ arriba.\n"
  );
  await pool.end();
  process.exit(fallos === 0 ? 0 : 1);
};

main().catch(async (e) => {
  console.error("\nError durante la verificación:", e);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
