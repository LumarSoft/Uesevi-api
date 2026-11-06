// Normalización y validación de la composición salarial.
// El front manda FormData, así que todo llega como string (incluido `conceptos`,
// que viene como JSON serializado). Estas funciones son puras para poder testearlas.

export const MAX_CONCEPTOS = 8;
export const CATEGORIA_POR_DEFECTO = "Vigilador General";

// Convierte lo que llega en `conceptos` a [{ nombre, monto }] o devuelve { error }.
export const parseConceptos = (raw) => {
  let value = raw;

  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return { error: "Los conceptos deben ser un JSON válido" };
    }
  }

  if (!Array.isArray(value) || value.length === 0) {
    return { error: "Debe cargar al menos un concepto" };
  }

  if (value.length > MAX_CONCEPTOS) {
    return { error: `Se permiten hasta ${MAX_CONCEPTOS} conceptos` };
  }

  const conceptos = [];
  const nombresVistos = new Set();

  for (const [i, item] of value.entries()) {
    const nombre = String(item?.nombre ?? "").trim();
    const monto = Number(item?.monto);

    if (!nombre) return { error: `El concepto ${i + 1} no tiene nombre` };
    if (nombre.length > 60) {
      return { error: `El nombre "${nombre}" supera los 60 caracteres` };
    }
    if (!Number.isFinite(monto) || monto < 0) {
      return { error: `El monto de "${nombre}" no es válido` };
    }

    const clave = nombre.toLowerCase();
    if (nombresVistos.has(clave)) {
      return { error: `El concepto "${nombre}" está repetido` };
    }
    nombresVistos.add(clave);

    conceptos.push({ nombre, monto: Math.round(monto * 100) / 100 });
  }

  return { conceptos };
};

// Valida el cuerpo completo de un POST/PUT y devuelve { data } normalizado o { error }.
export const validateComposition = (body = {}) => {
  const year = Number(body.year);
  const mes = Number(body.mes);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: "El año no es válido" };
  }
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    return { error: "El mes debe estar entre 1 y 12" };
  }

  const categoria =
    String(body.categoria ?? "").trim() || CATEGORIA_POR_DEFECTO;
  if (categoria.length > 120) {
    return { error: "La categoría supera los 120 caracteres" };
  }

  const notaRaw = body.nota == null ? "" : String(body.nota).trim();
  if (notaRaw.length > 255) {
    return { error: "La nota supera los 255 caracteres" };
  }
  const nota = notaRaw || null;

  const publicado =
    body.publicado === undefined || body.publicado === null
      ? 1
      : ["0", "false", "no"].includes(String(body.publicado).toLowerCase())
      ? 0
      : 1;

  const parsed = parseConceptos(body.conceptos);
  if (parsed.error) return { error: parsed.error };

  return {
    data: { year, mes, categoria, nota, publicado, conceptos: parsed.conceptos },
  };
};

export const totalConceptos = (conceptos = []) =>
  Math.round(
    conceptos.reduce((acc, c) => acc + (Number(c?.monto) || 0), 0) * 100
  ) / 100;
