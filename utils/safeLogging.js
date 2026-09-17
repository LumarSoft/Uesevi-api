const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._~-]+/gi;

export const redactSecrets = (value) =>
  String(value ?? "")
    .replace(BEARER_PATTERN, "Bearer [REDACTED]")
    .replace(JWT_PATTERN, "[REDACTED_JWT]");

export const safeError = (error) => {
  if (!error) {
    return { message: "Error no disponible" };
  }

  if (typeof error !== "object") {
    return { message: redactSecrets(error) };
  }

  return {
    name: redactSecrets(error.name || "Error"),
    code: error.code ? redactSecrets(error.code) : undefined,
    message: redactSecrets(error.message || "Error sin mensaje"),
    stack: error.stack ? redactSecrets(error.stack) : undefined,
  };
};

export const logError = (message, error) => {
  console.error(message, safeError(error));
};

export const sanitizeConsoleArgument = (value) => {
  if (
    value instanceof Error ||
    (value && typeof value === "object" && ("message" in value || "sql" in value))
  ) {
    return safeError(value);
  }

  return value;
};

export const normalizeRequestPath = (value) => {
  const pathOnly = String(value || "/").split("?", 1)[0];

  return pathOnly
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
      "/:id"
    )
    .replace(/\/\d+(?=\/|$)/g, "/:id");
};

export const shouldLogRequest = (requestPath) =>
  requestPath !== "/health" &&
  requestPath !== "/uploads" &&
  !requestPath.startsWith("/uploads/");
