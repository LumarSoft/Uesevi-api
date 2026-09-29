import test from "node:test";
import assert from "node:assert/strict";

import { pool } from "../db/db.js";
import chatbotModel from "../models/chatbotModel.js";
import statementsModel from "../models/statementsModel.js";

test("el historial de empresas reúne fichas con el mismo CUIL y agrupa contratos repetidos", async () => {
  const original = pool.query;
  const consultas = [];
  pool.query = async (sql, params) => {
    consultas.push({ sql, params });
    if (sql.includes("FROM empleados WHERE id = ?")) return [[{ id: 13884, cuil: "20-24926410-6" }]];
    if (sql.includes("SELECT id FROM empleados")) return [[{ id: 5268 }, { id: 13884 }]];
    if (sql.includes("FROM sueldos s")) return [[
      { empresa_id: 10, year: 2025, mes: 1 },
      { empresa_id: 10, year: 2025, mes: 2 },
      { empresa_id: 10, year: 2025, mes: 4 },
      { empresa_id: 20, year: 2024, mes: 12 },
    ]];
    return [[
      { empleado_id: 13884, contrato_id: 5, empresa_id: 10, empresa: "VULCANO", cuit_empresa: "1", estado: 1, deleted: null, fecha_ingreso: new Date(2025, 0, 5) },
      { empleado_id: 13884, contrato_id: 4, empresa_id: 10, empresa: "VULCANO", cuit_empresa: "1", estado: 1, deleted: new Date() },
      { empleado_id: 5268, contrato_id: 3, empresa_id: 20, empresa: "VISEGUR", cuit_empresa: "2", estado: 1, deleted: new Date() },
    ]];
  };
  try {
    const historial = await chatbotModel.employeeCompanyHistory(13884);
    assert.deepEqual(historial.registros_empleado, [5268, 13884]);
    assert.equal(historial.empresas.length, 2);
    assert.equal(historial.empresas[0].empresa, "VULCANO");
    assert.equal(historial.empresas[0].contratos_registrados, 2);
    assert.equal(historial.empresas[0].vigente, true);
    assert.equal(historial.empresas[0].fecha_ingreso_registrada, "2025-01-05");
    assert.deepEqual(historial.empresas[0].tramos_declarados, [
      { desde: "1/2025", hasta: "2/2025" },
      { desde: "4/2025", hasta: "4/2025" },
    ]);
    assert.equal(historial.empresas[1].empresa, "VISEGUR");
    assert.equal(historial.empresas[1].vigente, false);
    assert.deepEqual(historial.empresas[1].tramos_declarados, [{ desde: "12/2024", hasta: "12/2024" }]);
    assert.equal(consultas[1].params[0], "20249264106");
    assert.deepEqual(consultas[2].params, [5268, 13884]);
    assert.deepEqual(consultas[3].params, [5268, 13884]);
    assert.match(consultas[3].sql, /MAX\(d2\.rectificada\)/);
  } finally {
    pool.query = original;
  }
});

test("el detalle histórico usa su propia declaración aunque no haya contratos activos", async () => {
  const original = pool.query;
  const consultas = [];
  pool.query = async (sql) => {
    consultas.push(sql);
    if (sql.includes("FROM declaraciones_juradas d\nINNER JOIN empresas")) {
      return [[{ id: 42, empresa_id: 7, nombre_empresa: "Empresa", cantidad_empleados_declaracion: 1, cantidad_afiliados_declaracion: 1, estado: 1, es_version_anterior: 1, subtotal: 100 }]];
    }
    if (sql.includes("FROM \n    sueldos s")) return [[{ nombre_completo: "Empleado", afiliado: "Sí", monto: 100 }]];
    return [[{ fas: 1, solidario: 2, sindical: 3, total: 6 }]];
  };
  try {
    const detalle = await statementsModel.getInfo(7, 42);
    assert.equal(detalle.cantidad_empleados_declaracion, 1);
    assert.equal(detalle.es_version_anterior, 1);
    assert.equal(detalle.empleados[0].nombre_completo, "Empleado");
    assert.deepEqual(detalle.desglose, { fas: 1, solidario: 2, sindical: 3, total: 6 });
    assert.match(consultas[0], /WHERE d\.id = \? AND d\.empresa_id = \?/);
    assert.match(consultas[0], /posterior\.rectificada > d\.rectificada/);
    assert.doesNotMatch(consultas[0], /c\.deleted IS NULL/);
    assert.match(consultas[1], /LEFT JOIN\s+contratos c/);
    assert.match(consultas[1], /AND d\.empresa_id = \?/);
    assert.match(consultas[1], /ELSE 'Sin dato' END AS afiliado/);
  } finally {
    pool.query = original;
  }
});

test("el historial detecta versiones anteriores aunque el estado no sea 3", async () => {
  const original = pool.query;
  pool.query = async (sql, params) => {
    assert.match(sql, /posterior\.rectificada > dj\.rectificada/);
    assert.deepEqual(params, [7, 2024, 11]);
    return [[{ id: 42, rectificada: 0, estado: 1, es_version_anterior: 1 }]];
  };
  try {
    const historial = await statementsModel.getHistory(7, 2024, 11);
    assert.equal(historial[0].estado, 1);
    assert.equal(historial[0].es_version_anterior, 1);
  } finally {
    pool.query = original;
  }
});

test("una rectificación desde una versión vieja se revierte antes de tocar contratos", async () => {
  const original = pool.getConnection;
  const consultas = [];
  let rollback = false;
  let released = false;
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    query: async (sql) => {
      consultas.push(sql);
      if (sql.includes("FOR UPDATE")) return [[{ empresa_id: 7, mes: 5, year: 2026, rectificada: 0 }]];
      return [[{ rectificada: 1 }]];
    },
    rollback: async () => { rollback = true; },
    release: () => { released = true; },
  });
  try {
    await assert.rejects(statementsModel.rectify([{}], 7, 42), /versión vigente/);
    assert.equal(consultas.length, 2);
    assert.equal(rollback, true);
    assert.equal(released, true);
  } finally {
    pool.getConnection = original;
  }
});

test("no se puede borrar una declaración de un período rectificado", async () => {
  const original = pool.getConnection;
  const consultas = [];
  let rollback = false;
  pool.getConnection = async () => ({
    beginTransaction: async () => {},
    query: async (sql) => {
      consultas.push(sql);
      return [[{ total: 2, ultima_rectificacion: 1 }]];
    },
    rollback: async () => { rollback = true; },
    release: () => {},
  });
  try {
    await assert.rejects(statementsModel.deleteOne(42), /conservar su historial/);
    assert.equal(consultas.length, 1);
    assert.equal(rollback, true);
  } finally {
    pool.getConnection = original;
  }
});
