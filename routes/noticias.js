import express from "express";
import noticiasController from "../controllers/noticias.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", noticiasController.getAll);

router.get("/:id", noticiasController.getById);

router.post(
  "/add-noticia",
  upload.fields([
    { name: "images", maxCount: 5 }, // Cambia el número según el límite de imágenes permitido
    { name: "pdf", maxCount: 1 },
  ]),
  noticiasController.addNoticia
);

router.put(
  "/update-noticia/:id",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "pdf", maxCount: 1 },
  ]),
  noticiasController.updateNoticia
);


router.delete("/delete-noticia/:id", noticiasController.deleteNoticia);

export default router;
