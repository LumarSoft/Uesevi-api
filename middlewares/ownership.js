import { pool } from "../db/db.js";

const forbidden = (res) =>
  res.status(403).json({
    ok: false,
    status: "error",
    statusCode: 403,
    message: "No autorizado para acceder a datos de otra empresa",
  });

/**
 * Crea los controles de pertenencia. La inyección de la base permite probarlos
 * sin conectarse a MySQL; en producción siempre se usa el pool real.
 */
export const createOwnershipGuards = (database = pool) => {
  const ownCompanyValueOrAdmin = (getRequestedCompany) => (req, res, next) => {
    if (req.user?.rol === "admin") return next();

    const requested = getRequestedCompany(req);
    if (
      !req.user?.idEmpresa ||
      requested === undefined ||
      requested === null ||
      String(req.user.idEmpresa) !== String(requested)
    ) {
      return forbidden(res);
    }

    return next();
  };

  const ownResourceOrAdmin = (getResourceId, query) =>
    async (req, res, next) => {
      if (req.user?.rol === "admin") return next();

      const companyId = req.user?.idEmpresa;
      const resourceId = getResourceId(req);
      if (!companyId || resourceId === undefined || resourceId === null) {
        return forbidden(res);
      }

      try {
        const [rows] = await database.query(query, [resourceId, companyId]);
        if (!rows.length) return forbidden(res);
        return next();
      } catch (error) {
        return next(error);
      }
    };

  return {
    ownCompanyOrAdmin: (paramName = "idCompany") =>
      ownCompanyValueOrAdmin((req) => req.params?.[paramName]),

    // Debe ejecutarse después de multer para que req.body esté disponible.
    ownBodyCompanyOrAdmin: (fieldName = "companyId") =>
      ownCompanyValueOrAdmin((req) => req.body?.[fieldName]),

    // En estas rutas :id es usuarios.id; se valida el contrato vigente de ese
    // usuario antes de permitir que una empresa edite o dé de baja al empleado.
    ownEmployeeOrAdmin: (paramName = "id") =>
      ownResourceOrAdmin(
        (req) => req.params?.[paramName],
        `SELECT 1
           FROM empleados e
           INNER JOIN contratos c ON c.empleado_id = e.id
          WHERE e.usuario_id = ?
            AND c.empresa_id = ?
            AND c.deleted IS NULL
          LIMIT 1`
      ),

    ownStatementOrAdmin: (paramName = "id") =>
      ownResourceOrAdmin(
        (req) => req.params?.[paramName],
        `SELECT 1
           FROM declaraciones_juradas
          WHERE id = ? AND empresa_id = ?
          LIMIT 1`
      ),

    // La rectificación recibe la declaración en el multipart body.
    ownBodyStatementOrAdmin: (fieldName = "statementId") =>
      ownResourceOrAdmin(
        (req) => req.body?.[fieldName],
        `SELECT 1
           FROM declaraciones_juradas
          WHERE id = ? AND empresa_id = ?
          LIMIT 1`
      ),
  };
};

export const {
  ownCompanyOrAdmin,
  ownBodyCompanyOrAdmin,
  ownEmployeeOrAdmin,
  ownStatementOrAdmin,
  ownBodyStatementOrAdmin,
} = createOwnershipGuards();
