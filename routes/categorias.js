import express from "express";
import categoriasController from "../controllers/categorias.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", categoriasController.getAll);

router.post("/add-categoria", upload.any(), categoriasController.addCategoria);

router.delete("/delete-categoria/:id", categoriasController.deleteCategoria);

export default router;
