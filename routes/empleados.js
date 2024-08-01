import express from "express";
import empleadosController from "../controllers/empleados.js";

const router = express.Router();

router.get("/", empleadosController.getAll);

export default router;
