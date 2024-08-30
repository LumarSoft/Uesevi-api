import express from "express";
import empleadosController from "../controllers/empleados.js";

const router = express.Router();

router.get("/", empleadosController.getAll);

router.get("/getByEmpresa/:id", empleadosController.getByEmpresa);

router.get("/getOldByEmpresa/:id", empleadosController.getOldByEmpresa);

export default router;
