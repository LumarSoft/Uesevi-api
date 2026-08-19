// Validación del Excel de declaraciones juradas (importación y rectificación).
//
// Motivo: antes la carga se hacía "a ciegas". Si una fila venía sin CUIL (o con
// una categoría inexistente, un sueldo no numérico, etc.) la query fallaba en
// medio de la transacción, se hacía rollback y el error se perdía: la API
// respondía 201 y el usuario veía "Archivo subido correctamente" aunque NO se
// había guardado nada.
//
// Ahora el payload se valida ANTES de tocar la base y se devuelve al front una
// lista de errores por fila (fila de Excel, campo y mensaje) para que la
// empresa pueda corregir el archivo.

// Columnas que el Excel debe traer sí o sí.
export const REQUIRED_FIELDS = [
  "nombre",
  "apellido",
  "cuil",
  "adherido_a_sindicato",
  "categora",
  "sueldo_bsico",
];

// Etiquetas legibles para los mensajes de error.
export const FIELD_LABELS = {
  nombre: "Nombre",
  apellido: "Apellido",
  cuil: "CUIL",
  adherido_a_sindicato: "Adherido a sindicato",
  categora: "Categoría",
  sueldo_bsico: "Sueldo básico",
  adicionales: "Adicionales",
  suma_no_remunerativa: "Suma no remunerativa",
  ad_remunerativo: "Adicional remunerativo",
};

// El Excel arranca en la fila 2 (la 1 son los encabezados).
export const excelRowNumber = (index) => index + 2;

/** Deja el CUIL en solo dígitos: acepta "20-12345678-9", "20 12345678 9", etc. */
export const normalizeCuil = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\D/g, "");

const normalizeText = (value) => String(value ?? "").trim();

const AFILIADO_VALUES = new Set(["si", "sí", "true", "verdadero", "1"]);
const NO_AFILIADO_VALUES = new Set(["no", "false", "falso", "0"]);

/**
 * Interpreta la columna "Adherido a sindicato".
 * OJO: los modelos comparaban `valor.toLowerCase() === "si"`, así que un Excel
 * con TRUE / 1 quedaba como NO afiliado (aporte solidario en vez de sindical)
 * sin avisar. Se centraliza acá para que import y rectificación coincidan.
 */
export const isAfiliado = (value) =>
  AFILIADO_VALUES.has(normalizeText(value).toLowerCase());

export const isValidSindicatoValue = (value) => {
  const v = normalizeText(value).toLowerCase();
  return AFILIADO_VALUES.has(v) || NO_AFILIADO_VALUES.has(v);
};

/** Convierte a número aceptando "1234,56" y "$ 1.234,56". Devuelve null si no es número. */
export const parseAmount = (value) => {
  if (value === undefined || value === null || normalizeText(value) === "") {
    return 0;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  let raw = normalizeText(value).replace(/\s|\$/g, "");

  // "1.234,56" (formato AR) -> "1234.56" ; "1234,56" -> "1234.56"
  if (raw.includes(",")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildError = (index, field, message) => ({
  fila: excelRowNumber(index),
  campo: field ? FIELD_LABELS[field] || field : null,
  mensaje: message,
});

/**
 * Valida y normaliza el listado de empleados recibido desde el Excel.
 *
 * @param {Array} employees            Filas crudas del Excel.
 * @param {Object} options
 * @param {string[]} options.validCategories Nombres de categorías existentes en el sistema.
 * @returns {{ errors: Array<{fila:number, campo:string|null, mensaje:string}>, employees: Array }}
 */
export const validateEmployees = (employees, { validCategories = [] } = {}) => {
  const errors = [];

  if (!Array.isArray(employees) || employees.length === 0) {
    errors.push({
      fila: null,
      campo: null,
      mensaje:
        "El archivo no contiene empleados. Verificá que la primera hoja del Excel tenga los datos y los encabezados correctos.",
    });
    return { errors, employees: [] };
  }

  const categoriesByName = new Map(
    validCategories
      .filter(Boolean)
      .map((name) => [String(name).trim().toLowerCase(), String(name)])
  );

  // CUIL -> primera fila donde apareció, para reportar el duplicado con contexto.
  const seenCuils = new Map();
  const normalized = [];

  employees.forEach((employee, index) => {
    const row = employee || {};
    const nombre = normalizeText(row.nombre);
    const apellido = normalizeText(row.apellido);
    const cuil = normalizeCuil(row.cuil);
    const categoriaRaw = normalizeText(row.categora);

    if (!nombre) {
      errors.push(buildError(index, "nombre", "El nombre no puede estar vacío"));
    }

    if (!apellido) {
      errors.push(
        buildError(index, "apellido", "El apellido no puede estar vacío")
      );
    }

    // --- CUIL: el caso que rompía la carga sin avisar ---
    if (!cuil) {
      errors.push(
        buildError(
          index,
          "cuil",
          `Falta el CUIL${
            nombre || apellido ? ` de ${nombre} ${apellido}`.trimEnd() : ""
          }. Es obligatorio para identificar al empleado.`
        )
      );
    } else if (cuil.length !== 11) {
      errors.push(
        buildError(
          index,
          "cuil",
          `El CUIL "${normalizeText(
            row.cuil
          )}" debe tener 11 dígitos (tiene ${cuil.length})`
        )
      );
    } else if (seenCuils.has(cuil)) {
      errors.push(
        buildError(
          index,
          "cuil",
          `CUIL duplicado: ${cuil} ya fue declarado en la fila ${seenCuils.get(
            cuil
          )}`
        )
      );
    } else {
      seenCuils.set(cuil, excelRowNumber(index));
    }

    // --- Categoría: si no existe, la query de categorías explotaba dentro de la transacción ---
    let categoriaFinal = categoriaRaw;
    if (!categoriaRaw) {
      errors.push(
        buildError(index, "categora", "La categoría no puede estar vacía")
      );
    } else if (categoriesByName.size > 0) {
      const match = categoriesByName.get(categoriaRaw.toLowerCase());
      if (!match) {
        errors.push(
          buildError(
            index,
            "categora",
            `La categoría "${categoriaRaw}" no existe en el sistema. Revisá las opciones disponibles.`
          )
        );
      } else {
        // Guardamos el nombre exacto del sistema: el modelo busca por nombre.
        categoriaFinal = match;
      }
    }

    // --- Sindicato ---
    if (!isValidSindicatoValue(row.adherido_a_sindicato)) {
      errors.push(
        buildError(
          index,
          "adherido_a_sindicato",
          `Valor inválido "${normalizeText(
            row.adherido_a_sindicato
          )}". Debe ser Sí o No.`
        )
      );
    }

    // --- Importes ---
    const amounts = {};
    const amountFields = [
      { field: "sueldo_bsico", required: true },
      { field: "adicionales", required: false },
      { field: "suma_no_remunerativa", required: false },
      { field: "ad_remunerativo", required: false },
    ];

    amountFields.forEach(({ field, required }) => {
      const rawValue = row[field];
      const isEmpty =
        rawValue === undefined ||
        rawValue === null ||
        normalizeText(rawValue) === "";

      if (isEmpty && required) {
        errors.push(
          buildError(
            index,
            field,
            `${FIELD_LABELS[field]} es obligatorio y no puede estar vacío`
          )
        );
        amounts[field] = 0;
        return;
      }

      const parsed = parseAmount(rawValue);
      if (parsed === null) {
        errors.push(
          buildError(
            index,
            field,
            `${FIELD_LABELS[field]} debe ser un número (se recibió "${normalizeText(
              rawValue
            )}")`
          )
        );
        amounts[field] = 0;
        return;
      }

      if (parsed < 0) {
        errors.push(
          buildError(index, field, `${FIELD_LABELS[field]} no puede ser negativo`)
        );
      }

      amounts[field] = parsed;
    });

    normalized.push({
      ...row,
      nombre,
      apellido,
      cuil,
      categora: categoriaFinal,
      adherido_a_sindicato: isAfiliado(row.adherido_a_sindicato) ? "si" : "no",
      sueldo_bsico: amounts.sueldo_bsico,
      adicionales: amounts.adicionales,
      suma_no_remunerativa: amounts.suma_no_remunerativa,
      ad_remunerativo: amounts.ad_remunerativo,
    });
  });

  return { errors, employees: normalized };
};

/** Arma un mensaje corto para el toast / log a partir de la lista de errores. */
export const buildErrorMessage = (errors, max = 3) => {
  if (!errors.length) return "";

  const describe = (e) =>
    e.fila ? `Fila ${e.fila}: ${e.mensaje}` : e.mensaje;

  const shown = errors.slice(0, max).map(describe);
  const rest = errors.length - shown.length;

  const detail = shown.join(" · ");
  return rest > 0
    ? `Se encontraron ${errors.length} errores en el archivo. ${detail} · y ${rest} más.`
    : `${errors.length === 1 ? "Se encontró 1 error" : `Se encontraron ${errors.length} errores`} en el archivo. ${detail}`;
};

export default {
  REQUIRED_FIELDS,
  FIELD_LABELS,
  excelRowNumber,
  normalizeCuil,
  isAfiliado,
  isValidSindicatoValue,
  parseAmount,
  validateEmployees,
  buildErrorMessage,
};
