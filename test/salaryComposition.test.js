import test from "node:test";
import assert from "node:assert/strict";

import {
  parseConceptos,
  validateComposition,
  totalConceptos,
} from "../utils/salaryComposition.js";

const conceptosOk = JSON.stringify([
  { nombre: "Básico", monto: "1053200" },
  { nombre: "Presentismo", monto: 180000 },
  { nombre: "Viáticos", monto: 534000 },
  { nombre: "Suma no remunerativa", monto: 60000 },
]);

test("parseConceptos acepta JSON serializado y normaliza montos a número", () => {
  const { conceptos, error } = parseConceptos(conceptosOk);
  assert.equal(error, undefined);
  assert.equal(conceptos.length, 4);
  assert.deepEqual(conceptos[0], { nombre: "Básico", monto: 1053200 });
  assert.equal(totalConceptos(conceptos), 1827200);
});

test("parseConceptos rechaza JSON inválido, listas vacías y montos negativos", () => {
  assert.match(parseConceptos("{no es json").error, /JSON/);
  assert.match(parseConceptos("[]").error, /al menos un concepto/);
  assert.match(
    parseConceptos([{ nombre: "Básico", monto: -1 }]).error,
    /no es válido/
  );
  assert.match(parseConceptos([{ nombre: "  ", monto: 1 }]).error, /nombre/);
});

test("parseConceptos rechaza conceptos repetidos y más de 8 ítems", () => {
  assert.match(
    parseConceptos([
      { nombre: "Básico", monto: 1 },
      { nombre: "básico", monto: 2 },
    ]).error,
    /repetido/
  );
  const muchos = Array.from({ length: 9 }, (_, i) => ({
    nombre: `C${i}`,
    monto: 1,
  }));
  assert.match(parseConceptos(muchos).error, /hasta 8/);
});

test("validateComposition normaliza el cuerpo que llega por FormData", () => {
  const { data, error } = validateComposition({
    year: "2026",
    mes: "10",
    categoria: "",
    nota: "  Total antes de descuentos  ",
    publicado: "1",
    conceptos: conceptosOk,
  });
  assert.equal(error, undefined);
  assert.equal(data.year, 2026);
  assert.equal(data.mes, 10);
  assert.equal(data.categoria, "Vigilador General");
  assert.equal(data.nota, "Total antes de descuentos");
  assert.equal(data.publicado, 1);
  assert.equal(data.conceptos.length, 4);
});

test("validateComposition interpreta publicado=0/false como borrador", () => {
  const base = { year: 2026, mes: 1, conceptos: conceptosOk };
  assert.equal(validateComposition({ ...base, publicado: "0" }).data.publicado, 0);
  assert.equal(
    validateComposition({ ...base, publicado: "false" }).data.publicado,
    0
  );
  assert.equal(validateComposition(base).data.publicado, 1);
});

test("validateComposition rechaza período inválido", () => {
  const base = { conceptos: conceptosOk };
  assert.match(validateComposition({ ...base, year: 2026, mes: 13 }).error, /mes/i);
  assert.match(validateComposition({ ...base, year: "abc", mes: 1 }).error, /año/i);
});
