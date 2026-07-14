import express from "express";
import paymentsPanelController from "../controllers/paymentsPanelController.js";
import upload from "../multerconfig.js";

// Panel de Pagos de Empresas — rutas.
// Ver docs/Uesevi_Evolutivo_Panel_de_Pagos_PLAN_TECNICO.md (Sección 3).

const router = express.Router();

// --- Lectura ---
router.get("/grid", paymentsPanelController.getGrid); // grilla multi-mes
router.get("/summary", paymentsPanelController.getSummary); // tarjetas de resumen
router.get(
  "/companies-management",
  paymentsPanelController.getCompaniesManagement
); // listado para modal de gestión (activar/desactivar)
router.get("/company/:idCompany", paymentsPanelController.getCompanyDetail); // detalle empresa
router.get(
  "/proposal/:idCompany/:year/:month",
  paymentsPanelController.getProposal
); // propuesta para confirmar pago

// --- Escritura ---
router.post(
  "/interest/preview",
  upload.none(),
  paymentsPanelController.previewInterest
); // interés en vivo (sin persistir)
router.put("/payment", upload.none(), paymentsPanelController.upsertPayment); // upsert override
router.post(
  "/payment/:id/confirm",
  upload.none(),
  paymentsPanelController.confirmPayment
); // confirmar (solo lectura luego)

export default router;
