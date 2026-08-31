import paymentsPanelModel from "../models/paymentsPanelModel.js";

// ============================================================================
// Panel de Pagos de Empresas — controlador.
// Sigue el patrón de respuesta estándar del proyecto (ver rateController.js).
// ============================================================================

const handleError = (
  res,
  error,
  statusCode = 500,
  defaultMessage = "Error interno del servidor"
) => {
  console.error("Error en paymentsPanelController:", error);
  res.status(statusCode).json({
    ok: false,
    status: "error",
    statusCode,
    message: defaultMessage,
    error: error?.message || null,
  });
};

const response = (res, data, statusCode = 200, message = "Éxito") => {
  res.status(statusCode).json({
    ok: true,
    status: "success",
    statusCode,
    message,
    data,
  });
};

const currentYear = () => new Date().getFullYear();

// Vista de montos: 'periodo' (devengado, default) | 'caja' (por fecha de pago).
const parseMode = (v) => (v === "caja" ? "caja" : "periodo");

const paymentsPanelController = {
  // GET /payments-panel/grid?year=&from=&to=&includeInactive=
  getGrid: async (req, res) => {
    try {
      const { year, from, to, includeInactive, mode } = req.query;
      const data = await paymentsPanelModel.getGrid({
        year: Number(year) || currentYear(),
        from: from ? Number(from) : 1,
        to: to ? Number(to) : 12,
        includeInactive: includeInactive === "1" || includeInactive === "true",
        mode: parseMode(mode),
      });
      response(res, data, 200, "Grilla obtenida con éxito");
    } catch (error) {
      handleError(res, error, 500, "Error al obtener la grilla de pagos");
    }
  },

  // GET /payments-panel/summary?year=&month=
  getSummary: async (req, res) => {
    try {
      const { year, month, mode } = req.query;
      if (!month) return handleError(res, null, 400, "Falta el parámetro month");
      const data = await paymentsPanelModel.getSummary({
        year: Number(year) || currentYear(),
        month: Number(month),
        mode: parseMode(mode),
      });
      response(res, data, 200, "Resumen obtenido con éxito");
    } catch (error) {
      handleError(res, error, 500, "Error al obtener el resumen");
    }
  },

  // GET /payments-panel/company/:idCompany?year=
  getCompanyDetail: async (req, res) => {
    try {
      const { idCompany } = req.params;
      const { year } = req.query;
      const data = await paymentsPanelModel.getCompanyDetail({
        idCompany: Number(idCompany),
        year: Number(year) || currentYear(),
      });
      if (!data) return handleError(res, null, 404, "Empresa no encontrada");
      response(res, data, 200, "Detalle obtenido con éxito");
    } catch (error) {
      handleError(res, error, 500, "Error al obtener el detalle de la empresa");
    }
  },

  // GET /payments-panel/proposal/:idCompany/:year/:month
  getProposal: async (req, res) => {
    try {
      const { idCompany, year, month } = req.params;
      const data = await paymentsPanelModel.getProposal({
        idCompany: Number(idCompany),
        year: Number(year),
        month: Number(month),
      });
      response(res, data, 200, "Propuesta obtenida con éxito");
    } catch (error) {
      handleError(res, error, 500, "Error al obtener la propuesta de pago");
    }
  },

  // POST /payments-panel/interest/preview
  previewInterest: async (req, res) => {
    try {
      const { declaracion_jurada_id, fecha_pago } = req.body;
      if (!declaracion_jurada_id || !fecha_pago) {
        return handleError(
          res,
          null,
          400,
          "declaracion_jurada_id y fecha_pago son requeridos"
        );
      }
      const data = await paymentsPanelModel.previewInterest({
        declaracion_jurada_id: Number(declaracion_jurada_id),
        fecha_pago,
      });
      response(res, data, 200, "Interés calculado con éxito");
    } catch (error) {
      handleError(res, error, 500, "Error al calcular el interés");
    }
  },

  // PUT /payments-panel/payment
  upsertPayment: async (req, res) => {
    try {
      const { declaracion_jurada_id, aplica_interes } = req.body;
      if (!declaracion_jurada_id) {
        return handleError(res, null, 400, "declaracion_jurada_id es requerido");
      }

      // El front manda FormData, así que el flag llega como string ("1"/"0",
      // "true"/"false"). Se normaliza a 1/0 acá; undefined significa "no lo
      // mandaron" y el modelo conserva el valor que ya estaba guardado.
      const payload = { ...req.body };
      if (aplica_interes !== undefined && aplica_interes !== null) {
        const v = String(aplica_interes).trim().toLowerCase();
        payload.aplica_interes = v === "1" || v === "true" ? 1 : 0;
      }

      const data = await paymentsPanelModel.upsertPayment(payload);
      response(res, data, 200, "Pago guardado con éxito");
    } catch (error) {
      handleError(res, error, 500, "Error al guardar el pago");
    }
  },

  // GET /payments-panel/companies-management
  getCompaniesManagement: async (req, res) => {
    try {
      // Ventana: últimos 12 meses desde hoy, en índice year*12 + (mes-1).
      const now = new Date();
      const hi = now.getFullYear() * 12 + now.getMonth();
      const lo = hi - 11;
      const data = await paymentsPanelModel.getCompaniesManagement({ lo, hi });
      response(res, data, 200, "Empresas obtenidas con éxito");
    } catch (error) {
      handleError(res, error, 500, "Error al obtener las empresas");
    }
  },

  // POST /payments-panel/payment/:id/confirm
  confirmPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await paymentsPanelModel.confirmPayment(Number(id));
      response(res, data, 200, "Pago confirmado con éxito");
    } catch (error) {
      handleError(res, error, 500, "Error al confirmar el pago");
    }
  },

  // POST /payments-panel/payment/:id/unconfirm
  unconfirmPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const data = await paymentsPanelModel.unconfirmPayment(Number(id));
      response(res, data, 200, "Pago desmarcado con éxito");
    } catch (error) {
      handleError(res, error, 500, "Error al desmarcar el pago");
    }
  },
};

export default paymentsPanelController;
