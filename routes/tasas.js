import express from "express";
import tasasController from "../controllers/tasas.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", tasasController.getAll);

router.put("/update-tasa/:id", upload.any(), tasasController.update);

export default router;
