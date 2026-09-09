import express from "express";
import statementsController from "../controllers/statementsController.js";
import upload from "../multerconfig.js";
import { requireRole } from "../middlewares/auth.js";
import {
  ownBodyCompanyOrAdmin,
  ownBodyStatementOrAdmin,
  ownCompanyOrAdmin,
  ownStatementOrAdmin,
} from "../middlewares/ownership.js";

const router = express.Router();

router.get("/deudoras-company", requireRole("admin"), statementsController.getDebtorCompanies);

router.get("/", requireRole("admin"), statementsController.getAll); // GET /statements

router.get("/:id", requireRole("admin"), statementsController.getOne); // GET /statements/:id (no lo usa el front; se restringe a admin)

router.get(
  "/info/:idEmpresa/:idDeclaracion",
  ownCompanyOrAdmin("idEmpresa"),
  statementsController.getInfo
); // GET /statements/info/:idEmpresa/:idDeclaracion (empresa: solo la suya; admin: todas)

router.get(
  "/company/:idCompany",
  ownCompanyOrAdmin("idCompany"),
  statementsController.getStatementsByCompany
); // GET /statements/:idCompany

router.get(
  "/company/:idCompany/filtered",
  ownCompanyOrAdmin("idCompany"),
  statementsController.getStatementsByCompanyFiltered
); // GET /statements/company/:idCompany/filtered

router.get(
  "/history/:idEmpresa/:year/:month",
  ownCompanyOrAdmin("idEmpresa"),
  statementsController.getHistory
); // GET /statements/history/:idEmpresa/:year/:month

router.put("/:id/state", requireRole("admin"), upload.any(), statementsController.changeState); // PUT /statements/:id/state

router.put(
  "/:id/date-payment",
  requireRole("admin", "empresa"),
  ownStatementOrAdmin("id"),
  upload.any(),
  statementsController.changeDatePayment
); // PUT /statements/:id/date-payment

router.post(
  "/rectifications",
  requireRole("admin", "empresa"),
  upload.none(),
  ownBodyCompanyOrAdmin("companyId"),
  ownBodyStatementOrAdmin("statementId"),
  statementsController.rectify
); // POST /statements/rectificar

router.put(
  "/:id/expiration",
  requireRole("admin"),
  upload.any(),
  statementsController.changeExpiration
); // PUT /statements/:id/expiration

router.delete("/:id", requireRole("admin"), statementsController.deleteOne); // DELETE /statements/:id

router.get("/salaries/:idEmployee", requireRole("admin"), statementsController.getSalaries); // solo admin (búsqueda de DDJJ)

router.get(
  "/lastDeclaration/:idCompany",
  ownCompanyOrAdmin("idCompany"),
  statementsController.getLastDeclaration
);

router.get(
  "/getMissingStatements/:idCompany",
  ownCompanyOrAdmin("idCompany"),
  statementsController.getMissingStatements
);

export default router;
