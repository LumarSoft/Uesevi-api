import express from "express";
import empresasController from "../controllers/empresas.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", empresasController.getAll);

router.put("/change-state/:id", upload.any(), empresasController.changeState);

router.delete("/delete/:id", empresasController.delete);

export default router;
