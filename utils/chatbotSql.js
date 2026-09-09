import { TABLAS_PERMITIDAS, COLUMNAS_PROHIBIDAS } from "../models/chatbotModel.js";

export const LIMITE_FILAS = 200;

// Palabras que no tienen ningún motivo para aparecer en una consulta de lectura.
// "replace" NO está: REPLACE(cuit, '-', '') es la forma normal de comparar
// CUIT/CUIL, y la sentencia REPLACE INTO queda bloqueada igual por "into".
const PALABRAS_PROHIBIDAS = [
  "insert", "update", "delete", "drop", "alter", "create", "truncate",
  "grant", "revoke", "rename", "lock", "unlock", "call", "handler",
  "load_file", "outfile", "dumpfile", "infile", "prepare", "execute",
  "deallocate", "sleep", "benchmark", "information_schema", "performance_schema",
  "mysql", "sys", "user", "database", "version", "set", "into",
];

// `user`, `database` y `version` sólo molestan como funciones; los aceptamos
// como alias/columnas normales exigiendo que no vayan seguidos de "(".
const SOLO_COMO_FUNCION = new Set(["user", "database", "version"]);

class SqlInvalido extends Error {}

// Nombres definidos en la propia consulta (WITH nombre AS (...)) que después
// aparecen en FROM/JOIN y no son tablas reales.
const nombresDeCte = (sqlMinuscula) => {
  const nombres = new Set();
  // Primer CTE: "with [recursive] nombre as ("; siguientes: ", nombre as (".
  for (const m of sqlMinuscula.matchAll(/\bwith\s+(?:recursive\s+)?`?([a-z0-9_]+)`?\s*(?:\([^)]*\))?\s*as\s*\(/g)) {
    nombres.add(m[1]);
  }
  for (const m of sqlMinuscula.matchAll(/\)\s*,\s*`?([a-z0-9_]+)`?\s*(?:\([^)]*\))?\s*as\s*\(/g)) {
    nombres.add(m[1]);
  }
  return nombres;
};

/**
 * Valida una consulta SELECT propuesta por el modelo y devuelve la versión
 * final a ejecutar (con LIMIT garantizado). Lanza `SqlInvalido` con un motivo
 * legible que se le devuelve al modelo como resultado de la herramienta.
 */
export const validarConsultaLectura = (sqlOriginal) => {
  if (typeof sqlOriginal !== "string" || !sqlOriginal.trim()) {
    throw new SqlInvalido("La consulta está vacía.");
  }

  let sql = sqlOriginal.trim().replace(/;+\s*$/, "");

  if (sql.includes(";")) {
    throw new SqlInvalido("No se permite más de una sentencia por consulta.");
  }
  if (/--|\/\*|#/.test(sql)) {
    throw new SqlInvalido("No se permiten comentarios dentro de la consulta.");
  }
  if (!/^\s*(select|with)\b/i.test(sql)) {
    throw new SqlInvalido("Sólo se permiten consultas SELECT (o WITH ... SELECT).");
  }

  const minuscula = sql.toLowerCase();

  for (const palabra of PALABRAS_PROHIBIDAS) {
    const regex = SOLO_COMO_FUNCION.has(palabra)
      ? new RegExp(`\\b${palabra}\\s*\\(`, "i")
      : new RegExp(`\\b${palabra}\\b`, "i");
    if (regex.test(minuscula)) {
      throw new SqlInvalido(
        `La consulta contiene "${palabra}", que no está permitido en modo lectura.`
      );
    }
  }

  for (const columna of COLUMNAS_PROHIBIDAS) {
    if (new RegExp(`\\b${columna}\\b`, "i").test(minuscula)) {
      throw new SqlInvalido(
        `La columna "${columna}" es sensible y no se puede consultar.`
      );
    }
  }

  // Tablas referenciadas: todo lo que sigue a FROM o JOIN.
  const ctes = nombresDeCte(minuscula);
  const referencias = [...minuscula.matchAll(/\b(?:from|join)\s+`?([a-z0-9_]+)`?/g)]
    .map((m) => m[1])
    .filter((t) => !ctes.has(t));
  // Los alias de subconsultas no aparecen acá porque "from (" no matchea el patrón.
  const noPermitidas = referencias.filter((t) => !TABLAS_PERMITIDAS.includes(t));
  if (noPermitidas.length) {
    throw new SqlInvalido(
      `Tabla(s) no habilitada(s): ${[...new Set(noPermitidas)].join(", ")}. ` +
        `Las disponibles son: ${TABLAS_PERMITIDAS.join(", ")}.`
    );
  }
  if (!referencias.length) {
    throw new SqlInvalido("La consulta no referencia ninguna tabla conocida.");
  }

  // LIMIT obligatorio y acotado.
  const limitFinal = minuscula.match(/\blimit\s+(\d+)\s*$/);
  if (!limitFinal) {
    sql = `${sql} LIMIT ${LIMITE_FILAS}`;
  } else if (Number(limitFinal[1]) > LIMITE_FILAS) {
    sql = sql.replace(/\blimit\s+\d+\s*$/i, `LIMIT ${LIMITE_FILAS}`);
  }

  return sql;
};

export { SqlInvalido };
