import express from "express";
import noticiasController from "../controllers/noticias.js";

const router = express.Router();

router.get("/", noticiasController.getAll);

// EL METODO POST VA A TENER UN BODY
router.post("/add-noticia", noticiasController.addNoticia);

router.put("/update-noticia/:id", noticiasController.updateNoticia);

export default router;
