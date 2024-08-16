import express from "express";
import declaracionesViejasController from "../controllers/declaracionesViejas.js";

const router = express.Router();

router.get("/", declaracionesViejasController.getAll);

export default router;
