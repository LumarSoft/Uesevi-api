import express from "express";
import empleadosController from "../controllers/empleados.js";

const router = express.Router();

router.get("/", empleadosController.getAll);

router.get("/getByEmpresa/:id", empleadosController.getByEmpresa);

export default router;
