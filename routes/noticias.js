import express from "express";
import noticiasController from "../controllers/noticias.js";

const router = express.Router();

router.get("/", noticiasController.getAll);

router.get("/:id", noticiasController.getById);

router.post("/add-noticia", noticiasController.addNoticia);

router.put("/update-noticia/:id", noticiasController.updateNoticia);

router.delete("/delete-noticia/:id", noticiasController.deleteNoticia);

export default router;
