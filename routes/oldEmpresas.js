import express from "express";
import oldEmpresasController from "../controllers/oldEmpresas.js";

const router = express.Router();

router.get("/", oldEmpresasController.getAll);

export default router;
