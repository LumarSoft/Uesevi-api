import express from "express";
import employeesController from "../controllers/employeesController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", employeesController.getAll);

router.get("/get-By-company/:id", employeesController.getByCompany);

router.get("/get-Old-By-company/:id", employeesController.getOldByCompany);

router.post("/addEmployee", upload.any(), employeesController.addEmployee);

export default router;
