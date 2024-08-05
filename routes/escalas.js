import express from "express";
import escalasController from "../controllers/escalasController.js";

const router = express.Router();

router.get("/", escalasController.getAll);

export default router;
