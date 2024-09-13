import express from "express";
import newsController from "../controllers/newsController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", newsController.getAll);

router.get("/:id", newsController.getById);

router.post(
  "/add-new",
  upload.fields([
    { name: "images", maxCount: 5 }, // Cambia el número según el límite de imágenes permitido
    { name: "pdf", maxCount: 1 },
  ]),
  newsController.addNew
);

router.put(
  "/update-new/:id",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "pdf", maxCount: 1 },
  ]),
  newsController.updateNew
);

router.delete("/delete-new/:id", newsController.deleteNew);

export default router;
