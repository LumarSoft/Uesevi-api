import express from "express";
import contratosController from "../controllers/contratos.js";

const router = express.Router()

router.get("/", contratosController.getAll);

export default router;