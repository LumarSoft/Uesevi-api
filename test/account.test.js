import test from "node:test";
import assert from "node:assert/strict";

import { createAccountController } from "../controllers/accountController.js";
import {
  isValidEmail,
  normalizeEmail,
  pickEmpresaUser,
} from "../utils/accountUtils.js";

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

// Modelo en memoria: usuario 10 (empresa 5) y usuario 11 con otro email.
const fakeModel = () => {
  const users = [
    { id: 10, email: "estudio@gmail.com", password: "hash:clave-vieja", rol: "empresa" },
    { id: 11, email: "otra@empresa.com", password: "hash:x", rol: "empresa" },
  ];
  return {
    users,
    getAccount: async (id) => users.find((u) => u.id === id) || null,
    getCredentials: async (id) => users.find((u) => u.id === id) || null,
    isEmailTaken: async (email, excludeId) =>
      users.some((u) => u.email === email && u.id !== excludeId),
    updateEmail: async (id, email) => {
      users.find((u) => u.id === id).email = email;
      return 1;
    },
    updatePassword: async (id, hash) => {
      users.find((u) => u.id === id).password = hash;
      return 1;
    },
  };
};

const controller = (model, notices = []) =>
  createAccountController({
    model,
    comparePassword: async (plain, hash) => hash === `hash:${plain}`,
    hashPassword: async (plain) => `hash:${plain}`,
    generateToken: (user, idEmpresa) => `token:${user.id}:${user.email}:${idEmpresa}`,
    notifyEmailChanged: async (prev, next) => notices.push([prev, next]),
  });

const req = (body) => ({ user: { id: 10, rol: "empresa", idEmpresa: 5 }, body });

test("normalizeEmail y isValidEmail", () => {
  assert.equal(normalizeEmail("  Ale@Yahoo.com.AR "), "ale@yahoo.com.ar");
  assert.equal(isValidEmail("ale@yahoo.com.ar"), true);
  assert.equal(isValidEmail("usuario"), false);
  assert.equal(isValidEmail("a b@c.com"), false);
});

test("login con email compartido: entra sólo el usuario cuya clave coincide", async () => {
  const candidates = [
    { id: 2182, password: "a" },
    { id: 21190, password: "b" },
  ];
  const match = (plain) => async (u) => u.password === plain;

  assert.equal((await pickEmpresaUser(candidates, match("b"))).user.id, 21190);
  assert.equal((await pickEmpresaUser(candidates, match("a"))).user.id, 2182);
  assert.equal((await pickEmpresaUser(candidates, match("z"))).error, "PASSWORD");
  assert.equal((await pickEmpresaUser([], match("a"))).error, "NO_EXISTE");
  assert.equal(
    (await pickEmpresaUser([{ id: 1, password: "a" }, { id: 2, password: "a" }], match("a"))).error,
    "AMBIGUO"
  );
});

test("cambiar email: exige la contraseña actual", async () => {
  const model = fakeModel();
  const res = response();
  await controller(model).updateEmail(
    req({ newEmail: "nuevo@yahoo.com.ar", currentPassword: "otra" }),
    res
  );
  assert.equal(res.statusCode, 400);
  assert.equal(model.users[0].email, "estudio@gmail.com");
});

test("cambiar email: rechaza un email que ya usa otra empresa", async () => {
  const model = fakeModel();
  const res = response();
  await controller(model).updateEmail(
    req({ newEmail: " OTRA@empresa.com ", currentPassword: "clave-vieja" }),
    res
  );
  assert.equal(res.statusCode, 409);
  assert.equal(model.users[0].email, "estudio@gmail.com");
});

test("cambiar email: actualiza, normaliza, avisa al email anterior y devuelve token nuevo", async () => {
  const model = fakeModel();
  const notices = [];
  const res = response();
  await controller(model, notices).updateEmail(
    req({ newEmail: " Nuevo@Yahoo.com.ar", currentPassword: "clave-vieja" }),
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(model.users[0].email, "nuevo@yahoo.com.ar");
  assert.deepEqual(notices, [["estudio@gmail.com", "nuevo@yahoo.com.ar"]]);
  assert.equal(res.body.data.token, "token:10:nuevo@yahoo.com.ar:5");
});

test("cambiar email: un fallo del mail de aviso no rompe el cambio", async () => {
  const model = fakeModel();
  const res = response();
  await createAccountController({
    model,
    comparePassword: async (plain, hash) => hash === `hash:${plain}`,
    generateToken: () => "t",
    notifyEmailChanged: async () => {
      throw new Error("SMTP caído");
    },
  }).updateEmail(req({ newEmail: "nuevo@yahoo.com.ar", currentPassword: "clave-vieja" }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(model.users[0].email, "nuevo@yahoo.com.ar");
});

test("cambiar contraseña: valida longitud y contraseña actual", async () => {
  const model = fakeModel();

  let res = response();
  await controller(model).updatePassword(
    req({ currentPassword: "clave-vieja", newPassword: "corta" }),
    res
  );
  assert.equal(res.statusCode, 400);

  res = response();
  await controller(model).updatePassword(
    req({ currentPassword: "incorrecta", newPassword: "nueva-clave-123" }),
    res
  );
  assert.equal(res.statusCode, 400);
  assert.equal(model.users[0].password, "hash:clave-vieja");
});

test("cambiar contraseña: actualiza sólo el usuario del token", async () => {
  const model = fakeModel();
  const res = response();
  await controller(model).updatePassword(
    req({ currentPassword: "clave-vieja", newPassword: "nueva-clave-123" }),
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(model.users[0].password, "hash:nueva-clave-123");
  assert.equal(model.users[1].password, "hash:x");
});
