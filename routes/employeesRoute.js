import express from "express";
import employeesController from "../controllers/employeesController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", employeesController.getAll); // GET /employees

router.get("/company/:id", employeesController.getByCompany); // GET /employees/company/:id

router.get("/company/historic/:id", employeesController.getHistoricByCompany);

router.get("/company/:id/old", employeesController.getOldByCompany); // GET /employees/company/:id/old

router.put("/:id", upload.none(), employeesController.editEmployee); // PUT /employees/:id

router.delete("/:id", employeesController.deleteEmployee); // DELETE /employees/:id

router.post("/", upload.none(), employeesController.addEmployee); // POST /employees

router.post("/import", upload.none(), employeesController.importEmployees); // POST /employees/import

export default router;
