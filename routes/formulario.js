import express from "express";
import formularioController from "../controllers/formulario.js";

const router = express.Router();

router.get("/", formularioController.getAll);

router.put("/change-empresa/:id", formularioController.changeEmpresa);

export default router;