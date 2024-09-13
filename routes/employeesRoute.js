import express from "express";
import employeesController from "../controllers/employeesController.js";

const router = express.Router();

router.get("/", employeesController.getAll);

router.get("/get-By-company/:id", employeesController.getByCompany);

router.get("/get-Old-By-company/:id", employeesController.getOldByCompany);

export default router;
