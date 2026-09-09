import test from "node:test";
import assert from "node:assert/strict";

import { createOwnershipGuards } from "../middlewares/ownership.js";

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const run = async (middleware, req) => {
  const res = response();
  let nextCalls = 0;
  let nextError = null;

  await middleware(req, res, (error) => {
    nextCalls += 1;
    nextError = error || null;
  });

  return { res, nextCalls, nextError };
};

test("una empresa puede usar el companyId de su token", async () => {
  const guards = createOwnershipGuards();
  const result = await run(guards.ownBodyCompanyOrAdmin(), {
    user: { rol: "empresa", idEmpresa: 12 },
    body: { companyId: "12" },
  });

  assert.equal(result.nextCalls, 1);
  assert.equal(result.res.statusCode, 200);
});

test("una empresa no puede enviar el companyId de otra empresa", async () => {
  const guards = createOwnershipGuards();
  const result = await run(guards.ownBodyCompanyOrAdmin(), {
    user: { rol: "empresa", idEmpresa: 12 },
    body: { companyId: "99" },
  });

  assert.equal(result.nextCalls, 0);
  assert.equal(result.res.statusCode, 403);
  assert.equal(result.res.body.statusCode, 403);
});

test("un administrador conserva acceso a cualquier empresa", async () => {
  const guards = createOwnershipGuards({
    query: async () => {
      throw new Error("no debe consultar la base para un administrador");
    },
  });
  const result = await run(guards.ownBodyCompanyOrAdmin(), {
    user: { rol: "admin" },
    body: { companyId: "99" },
  });

  assert.equal(result.nextCalls, 1);
  assert.equal(result.nextError, null);
});

test("una empresa puede editar un empleado con contrato propio vigente", async () => {
  const calls = [];
  const guards = createOwnershipGuards({
    query: async (query, params) => {
      calls.push({ query, params });
      return [[{ owned: 1 }]];
    },
  });
  const result = await run(guards.ownEmployeeOrAdmin(), {
    user: { rol: "empresa", idEmpresa: 12 },
    params: { id: "45" },
  });

  assert.equal(result.nextCalls, 1);
  assert.deepEqual(calls[0].params, ["45", 12]);
  assert.match(calls[0].query, /contratos/);
});

test("una empresa no puede editar ni dar de baja empleados ajenos", async () => {
  const guards = createOwnershipGuards({
    query: async () => [[]],
  });
  const result = await run(guards.ownEmployeeOrAdmin(), {
    user: { rol: "empresa", idEmpresa: 12 },
    params: { id: "45" },
  });

  assert.equal(result.nextCalls, 0);
  assert.equal(result.res.statusCode, 403);
});

test("una empresa puede modificar una declaración propia", async () => {
  const calls = [];
  const guards = createOwnershipGuards({
    query: async (query, params) => {
      calls.push({ query, params });
      return [[{ owned: 1 }]];
    },
  });
  const result = await run(guards.ownStatementOrAdmin(), {
    user: { rol: "empresa", idEmpresa: 12 },
    params: { id: "81" },
  });

  assert.equal(result.nextCalls, 1);
  assert.deepEqual(calls[0].params, ["81", 12]);
  assert.match(calls[0].query, /declaraciones_juradas/);
});

test("una empresa no puede modificar ni rectificar declaraciones ajenas", async () => {
  const guards = createOwnershipGuards({
    query: async () => [[]],
  });
  const result = await run(guards.ownBodyStatementOrAdmin(), {
    user: { rol: "empresa", idEmpresa: 12 },
    body: { statementId: "81" },
  });

  assert.equal(result.nextCalls, 0);
  assert.equal(result.res.statusCode, 403);
});

test("los errores de base se delegan al manejador de Express", async () => {
  const databaseError = new Error("database unavailable");
  const guards = createOwnershipGuards({
    query: async () => {
      throw databaseError;
    },
  });
  const result = await run(guards.ownStatementOrAdmin(), {
    user: { rol: "empresa", idEmpresa: 12 },
    params: { id: "81" },
  });

  assert.equal(result.nextCalls, 1);
  assert.equal(result.nextError, databaseError);
});
