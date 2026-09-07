import express from "express";
import employeesController from "../controllers/employeesController.js";
import upload from "../multerconfig.js";
import { requireRole } from "../middlewares/auth.js";
import { ownCompanyOrAdmin } from "../middlewares/ownership.js";

const router = express.Router();

router.get("/", requireRole("admin"), employeesController.getAll); // GET /employees

router.get("/search", requireRole("admin"), employeesController.searchEmployees); // GET /employees/search?q=term&company_id=1&limit=50&offset=0

router.get("/company/:id", ownCompanyOrAdmin("id"), employeesController.getByCompany); // GET /employees/company/:id

router.get(
  "/company/historic/:id",
  ownCompanyOrAdmin("id"),
  employeesController.getHistoricByCompany
);

router.get("/company/:id/old", ownCompanyOrAdmin("id"), employeesController.getOldByCompany); // GET /employees/company/:id/old

router.get("/history/:empleadoId", requireRole("admin"), employeesController.getEmployeeHistory); // GET /employees/history/:empleadoId (historial cross-empresa por CUIL: solo admin)

router.get("/debug/:empleadoId", requireRole("admin"), employeesController.debugEmployeeData); // GET /employees/debug/:empleadoId - TEMPORAL

router.put("/:id", requireRole("admin"), upload.none(), employeesController.editEmployee); // PUT /employees/:id

router.delete("/:id", requireRole("admin"), employeesController.deleteEmployee); // DELETE /employees/:id

router.post("/", requireRole("admin"), upload.none(), employeesController.addEmployee); // POST /employees

router.post("/import", requireRole("admin"), upload.none(), employeesController.importEmployees); // POST /employees/import

export default router;
