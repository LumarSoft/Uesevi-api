import express from "express";
import employeesController from "../controllers/employeesController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", employeesController.getAll); // GET /employees

router.get("/search", employeesController.searchEmployees); // GET /employees/search?q=term&company_id=1&limit=50&offset=0

router.get("/company/:id", employeesController.getByCompany); // GET /employees/company/:id

router.get("/company/historic/:id", employeesController.getHistoricByCompany);

router.get("/company/:id/old", employeesController.getOldByCompany); // GET /employees/company/:id/old

router.get("/history/:empleadoId", employeesController.getEmployeeHistory); // GET /employees/history/:empleadoId

router.get("/debug/:empleadoId", employeesController.debugEmployeeData); // GET /employees/debug/:empleadoId - TEMPORAL

router.put("/:id", upload.none(), employeesController.editEmployee); // PUT /employees/:id

router.delete("/:id", employeesController.deleteEmployee); // DELETE /employees/:id

router.post("/", upload.none(), employeesController.addEmployee); // POST /employees

router.post("/import", upload.none(), employeesController.importEmployees); // POST /employees/import

export default router;
