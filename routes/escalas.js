import express from "express";
import escalasController from "../controllers/escalasController.js";

const router = express.Router();

router.get("/", escalasController.getAll);
router.delete("/delete/:id", escalasController.delete);
router.put("/update-escala/:id", escalasController.update);
export default router;
