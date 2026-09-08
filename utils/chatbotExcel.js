import * as XLSX from "xlsx";
import { pool } from "../db/db.js";
import {
  validateEmployees,
  REQUIRED_FIELDS,
  FIELD_LABELS,
} from "./employeeImportValidation.js";

// Tope de errores que se le describen al modelo con fila y campo. Un Excel roto
// puede tener miles; con una muestra alcanza para explicar el problema y evita
// mandar un prompt gigante.
const MAX_ERRORES_DETALLADOS = 40;
const MAX_FILAS_MUESTRA = 3;

export const EXTENSIONES_PERMITIDAS = [".xlsx", ".xls", ".xlsm", ".csv"];
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

/**
 * Normaliza los encabezados igual que el front antes de subir la declaración
 * (`formatKeys` en modules/company/empleados/importacion): minúsculas, espacios
 * a "_" y se eliminan los caracteres no alfanuméricos. De ahí salen las claves
 * mutiladas que espera el validador (`categora`, `sueldo_bsico`) — no las
 * "arregles", tienen que quedar así para que el análisis coincida con la
 * importación real.
 */
const normalizarClave = (clave) =>
  String(clave)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");

// Claves que nunca se copian: xlsx 0.18.5 arrastra un problema conocido de
// prototype pollution y este archivo viene de afuera de la organización.
const CLAVES_PELIGROSAS = new Set(["__proto__", "constructor", "prototype"]);

const normalizarFilas = (filas) =>
  filas.map((fila) => {
    const limpia = {};
    for (const clave of Object.keys(fila)) {
      const nueva = normalizarClave(clave);
      if (!nueva || CLAVES_PELIGROSAS.has(nueva)) continue;
      limpia[nueva] = fila[clave];
    }
    return limpia;
  });

const traerCategorias = async () => {
  const [rows] = await pool.query("SELECT nombre FROM categorias ORDER BY id ASC;");
  return rows.map((r) => r.nombre).filter(Boolean);
};

/**
 * Lee el Excel de una declaración jurada y lo pasa por la MISMA validación que
 * usa la importación real (`validateEmployees`), así lo que el chatbot le dice
 * al administrador coincide con lo que la empresa va a ver al subirlo.
 *
 * Devuelve un informe compacto pensado para meterlo en el prompt, no para
 * mostrarlo tal cual en pantalla.
 */
export const analizarExcelDeclaracion = async (archivo) => {
  let libro;
  try {
    libro = XLSX.read(archivo.buffer, { type: "buffer" });
  } catch (error) {
    return {
      archivo: archivo.originalname,
      legible: false,
      error: `No se pudo abrir el archivo: ${error.message}. Puede estar dañado o no ser un Excel válido.`,
    };
  }

  const nombreHoja = libro.SheetNames[0];
  if (!nombreHoja) {
    return {
      archivo: archivo.originalname,
      legible: false,
      error: "El archivo no tiene ninguna hoja.",
    };
  }

  const crudas = XLSX.utils.sheet_to_json(libro.Sheets[nombreHoja]);
  const filas = normalizarFilas(crudas);

  const columnasDetectadas = filas.length ? Object.keys(filas[0]) : [];
  // Se reportan con el título tal cual figura en la plantilla: las claves
  // internas (`categora`, `sueldo_bsico`) no le sirven a nadie fuera del código.
  const columnasFaltantes = REQUIRED_FIELDS.filter(
    (campo) => !columnasDetectadas.includes(campo)
  ).map((campo) => FIELD_LABELS[campo] || campo);

  const categoriasValidas = await traerCategorias();
  const { errors } = validateEmployees(filas, { validCategories: categoriasValidas });

  // Agrupamos por mensaje "tipo" para que el modelo pueda resumir en vez de
  // enumerar 300 veces el mismo problema.
  const porCampo = {};
  for (const error of errors) {
    const clave = error.campo || "General";
    porCampo[clave] = (porCampo[clave] || 0) + 1;
  }

  return {
    archivo: archivo.originalname,
    legible: true,
    hoja: nombreHoja,
    hojas_del_libro: libro.SheetNames,
    filas_leidas: filas.length,
    columnas_detectadas: columnasDetectadas,
    columnas_esperadas: REQUIRED_FIELDS.map((campo) => FIELD_LABELS[campo] || campo),
    columnas_obligatorias_faltantes: columnasFaltantes,
    categorias_validas_del_sistema: categoriasValidas,
    es_valido: errors.length === 0,
    cantidad_errores: errors.length,
    errores_por_campo: porCampo,
    errores: errors.slice(0, MAX_ERRORES_DETALLADOS),
    errores_omitidos: Math.max(0, errors.length - MAX_ERRORES_DETALLADOS),
    primeras_filas: filas.slice(0, MAX_FILAS_MUESTRA),
  };
};
