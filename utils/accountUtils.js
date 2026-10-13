// Helpers de cuentas de empresa (email de acceso y contraseña).
//
// usuarios.email no tiene UNIQUE y la tabla no tiene PRIMARY KEY, así que la
// unicidad del email de acceso de las empresas se garantiza en el código:
// un email sólo puede pertenecer a un usuario rol "empresa" no eliminado.

export const MIN_PASSWORD_LENGTH = 8;

export const EMAIL_DUPLICADO = "EMAIL_DUPLICADO";

export const EMAIL_DUPLICADO_MESSAGE =
  "Ya existe una empresa registrada con ese email de acceso. Use otro email o recupere la contraseña de la cuenta existente.";

export const EMAIL_COMPARTIDO_MESSAGE =
  "Este email está asociado a más de una empresa. Comuníquese con UESEVI para asignar un email distinto a cada una.";

export const normalizeEmail = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "")) &&
  String(value).length <= 200; // usuarios.email es varchar(200)

export const emailDuplicadoError = () => {
  const error = new Error(EMAIL_DUPLICADO_MESSAGE);
  error.code = EMAIL_DUPLICADO;
  return error;
};

/**
 * Elige con qué usuario empresa iniciar sesión cuando el email puede estar
 * repetido (datos viejos). Sólo cuentan los candidatos cuya contraseña
 * coincide; si coincide más de uno no se adivina cuál era.
 *
 * @param {Array} candidates usuarios rol empresa no eliminados, ordenados por id
 * @param {(user) => Promise<boolean>} passwordMatches
 * @returns {Promise<{ user?: object, error?: "NO_EXISTE"|"PASSWORD"|"AMBIGUO" }>}
 */
export const pickEmpresaUser = async (candidates, passwordMatches) => {
  if (!candidates || candidates.length === 0) return { error: "NO_EXISTE" };

  const matched = [];
  for (const candidate of candidates) {
    if (await passwordMatches(candidate)) matched.push(candidate);
  }

  if (matched.length === 0) return { error: "PASSWORD" };
  if (matched.length > 1) return { error: "AMBIGUO" };
  return { user: matched[0] };
};
