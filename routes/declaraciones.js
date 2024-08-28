import express from "express";
import declaracionesController from "../controllers/declaraciones.js";

const router = express.Router();

router.get("/", declaracionesController.getAll);

router.put("/changeState/:id", declaracionesController.changeState);

export default router;
