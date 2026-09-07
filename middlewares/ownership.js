export const ownCompanyOrAdmin = (paramName = "idCompany") => (req, res, next) => {
  if (req.user.rol === "admin") return next();

  const requested = String(req.params[paramName]);
  if (!req.user.idEmpresa || String(req.user.idEmpresa) !== requested) {
    return res.status(403).json({
      ok: false,
      status: "error",
      statusCode: 403,
      message: "No autorizado para acceder a datos de otra empresa",
    });
  }
  next();
};
