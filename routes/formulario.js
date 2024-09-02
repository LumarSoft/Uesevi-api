import express from "express";
import formularioController from "../controllers/formulario.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", formularioController.getAll);

router.put("/change-empresa/:id", upload.any(), formularioController.changeEmpresa);

export default router;