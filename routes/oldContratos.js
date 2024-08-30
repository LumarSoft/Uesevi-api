import express from "express";
import oldContratosController from "../controllers/oldContratos.js";

const router = express.Router()

router.get("/", oldContratosController.getAll);

export default router;