import express from "express";
import statementsController from "../controllers/statementsController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/deudoras-company", statementsController.getDebtorCompanies);

router.get("/", statementsController.getAll); // GET /statements

router.get("/:id", statementsController.getOne); // GET /statements/:id

router.get("/info/:idEmpresa/:idDeclaracion", statementsController.getInfo); // GET /statements/info/:idEmpresa/:idDeclaracion

router.get("/company/:idCompany", statementsController.getStatementsByCompany); // GET /statements/:idCompany

router.get("/history/:idEmpresa/:year/:month", statementsController.getHistory); // GET /statements/history/:idEmpresa/:year/:month

router.put("/:id/state", upload.any(), statementsController.changeState); // PUT /statements/:id/state

router.put(
  "/:id/date-payment",
  upload.any(),
  statementsController.changeDatePayment
); // PUT /statements/:id/date-payment

router.post("/rectifications", upload.none(), statementsController.rectify); // POST /statements/rectificar

router.put(
  "/:id/expiration",
  upload.any(),
  statementsController.changeExpiration
); // PUT /statements/:id/expiration

router.delete("/:id", statementsController.deleteOne); // DELETE /statements/:id

router.get("/salaries/:idEmployee", statementsController.getSalaries);

router.get(
  "/lastDeclaration/:idCompany",
  statementsController.getLastDeclaration
);

router.get(
  "/getMissingStatements/:idCompany",
  statementsController.getMissingStatements
);

export default router;
