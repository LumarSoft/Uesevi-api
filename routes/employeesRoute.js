import express from "express";
import employeesController from "../controllers/employeesController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", employeesController.getAll); // GET /employees

router.get("/company/:id", employeesController.getByCompany); // GET /employees/company/:id

router.get("/company/:id/old", employeesController.getOldByCompany); // GET /employees/company/:id/old

router.post("/", upload.any(), employeesController.addEmployee); // POST /employees

router.put("/:id", upload.any(), employeesController.editEmployee); // PUT /employees/:id

router.delete("/:id", employeesController.deleteEmployee); // DELETE /employees/:id

router.post("/import", upload.any(), employeesController.importEmployees); // POST /employees/import

export default router;
