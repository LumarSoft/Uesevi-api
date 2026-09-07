import jwt from "jsonwebtoken";

export const authRequired = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      ok: false,
      status: "error",
      statusCode: 401,
      message: "No autenticado: falta el token",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, rol, idEmpresa?, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      status: "error",
      statusCode: 401,
      message:
        err.name === "TokenExpiredError" ? "Sesión expirada" : "Token inválido",
    });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({
      ok: false,
      status: "error",
      statusCode: 403,
      message: "No autorizado para esta acción",
    });
  }
  next();
};
