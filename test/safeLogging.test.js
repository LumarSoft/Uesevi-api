import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeRequestPath,
  redactSecrets,
  safeError,
  shouldLogRequest,
} from "../utils/safeLogging.js";

test("el log HTTP elimina query strings e identificadores", () => {
  assert.equal(
    normalizeRequestPath("/employees/123?token=secreto"),
    "/employees/:id"
  );
  assert.equal(
    normalizeRequestPath("/forms/550e8400-e29b-41d4-a716-446655440000"),
    "/forms/:id"
  );
});

test("health y uploads no generan access logs", () => {
  assert.equal(shouldLogRequest("/health"), false);
  assert.equal(shouldLogRequest("/uploads/documento.pdf"), false);
  assert.equal(shouldLogRequest("/employees"), true);
});

test("los errores no exponen SQL ni tokens", () => {
  const error = new Error(
    "Falló Bearer eyJhbGciOiJIUzI1NiJ9.cGF5bG9hZA.signature"
  );
  error.code = "ER_PARSE_ERROR";
  error.sql = "SELECT * FROM usuarios";

  const sanitized = safeError(error);

  assert.equal(sanitized.code, "ER_PARSE_ERROR");
  assert.doesNotMatch(JSON.stringify(sanitized), /SELECT \*/);
  assert.doesNotMatch(JSON.stringify(sanitized), /eyJhbGci/);
  assert.match(redactSecrets(error.message), /\[REDACTED\]/);
});
