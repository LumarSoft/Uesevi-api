import express from "express";
import tasasController from "../controllers/tasas.js";

const router = express.Router();

router.get("/", tasasController.getAll);

export default router;
