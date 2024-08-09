import express from "express";
import tasasController from "../controllers/tasas.js";

const router = express.Router();

router.get("/", tasasController.getAll);

router.put("/update-tasa/:id", tasasController.update);

export default router;
