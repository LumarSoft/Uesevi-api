import test from "node:test";
import assert from "node:assert/strict";

import { pool } from "../db/db.js";
import employeesModel from "../models/employeesModel.js";
import statementsModel from "../models/statementsModel.js";

const employee = {
  cuil: "20-12345678-9",
  nombre: "Ana",
  apellido: "Pérez",
  categora: "Categoría 1",
  adherido_a_sindicato: "No",
  sueldo_bsico: 100,
  adicionales: 0,
  suma_no_remunerativa: 0,
  ad_remunerativo: 0,
};

async function runUpload({ rectify, hasLaterPeriod, newEmployee = false }) {
  const original = pool.getConnection;
  const queries = [];
  let committed = false;
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    query: async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes("FOR UPDATE")) return [[{ empresa_id: 7, mes: 5, year: 2026, vencimiento: new Date(), rectificada: 0 }]];
      if (sql.includes("MAX(rectificada) AS rectificada")) return [[{ rectificada: 0 }]];
      if (sql.includes("AS tiene_periodo_posterior")) return [[{ tiene_periodo_posterior: hasLaterPeriod ? 1 : 0 }]];
      if (sql.includes("rectificada = 0") && sql.includes("SELECT id FROM declaraciones_juradas")) return [[]];
      if (sql.includes("SELECT id FROM declaraciones_juradas")) return [[{ id: 1 }]];
      if (sql.includes("SELECT id, usuario_id, cuil")) return [newEmployee ? [] : [{ id: 2, usuario_id: 3 }]];
      if (sql.includes("SELECT id,sueldo_basico,presentismo")) return [[{ id: 1, sueldo_basico: 100, presentismo: 0 }]];
      if (sql.includes("SELECT id FROM categorias")) return [[{ id: 1 }]];
      if (sql.includes("SELECT sueldo_basico FROM categorias")) return [[{ sueldo_basico: 100 }]];
      if (sql.includes("SELECT id FROM contratos WHERE empleado_id")) return [[{ id: 11 }]];
      if (sql.includes("SELECT MAX(id)")) return [[{ lastId: 10 }]];
      return [[]];
    },
    commit: async () => { committed = true; },
    rollback: async () => { assert.fail("La carga no debería revertirse"); },
    release: () => {},
  });
  try {
    const result = rectify
      ? await statementsModel.rectify([employee], 7, 42)
      : await employeesModel.importEmployees([employee], 7, 5, 2026);
    assert.equal(result.status, "OK");
    assert.equal(committed, true);
    return queries;
  } finally {
    pool.getConnection = original;
  }
}

for (const rectify of [false, true]) {
  const label = rectify ? "rectificación" : "declaración original";

  test(`una ${label} histórica guarda el detalle sin reemplazar la nómina vigente`, async () => {
    const queries = await runUpload({ rectify, hasLaterPeriod: true });
    assert.ok(queries.some(({ sql }) => sql.includes("INSERT INTO sueldos")));
    assert.ok(queries.some(({ sql }) => sql.includes("INSERT INTO contratos") && sql.includes("deleted) VALUES")));
    assert.ok(!queries.some(({ sql }) => sql.includes("UPDATE contratos SET deleted")));
    assert.ok(!queries.some(({ sql }) => sql.includes("UPDATE empleados SET categoria_id")));
    assert.ok(!queries.some(({ sql }) => sql.includes("UPDATE usuarios SET nombre")));
  });

  test(`una ${label} del último período reemplaza la nómina vigente`, async () => {
    const queries = await runUpload({ rectify, hasLaterPeriod: false });
    assert.ok(queries.some(({ sql }) => sql.includes("UPDATE contratos SET deleted")));
    assert.ok(queries.some(({ sql }) => sql.includes("INSERT INTO contratos") && !sql.includes("deleted) VALUES")));
    assert.ok(queries.some(({ sql }) => sql.includes("UPDATE empleados SET categoria_id")));
  });

  test(`una ${label} histórica puede incorporar una ficha nueva sin darla de alta como vigente`, async () => {
    const queries = await runUpload({ rectify, hasLaterPeriod: true, newEmployee: true });
    assert.ok(queries.some(({ sql }) => sql.includes("INSERT INTO empleados")));
    assert.ok(queries.some(({ sql }) => sql.includes("INSERT INTO contratos") && sql.includes("deleted) VALUES")));
    assert.ok(!queries.some(({ sql }) => sql.includes("UPDATE contratos SET deleted")));
  });
}
