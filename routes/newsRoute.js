import express from "express";
import newsController from "../controllers/newsController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", newsController.getAll); // GET /news

router.get("/last-three", newsController.getLastThree); // GET /news/last-three

router.get("/client/:page", newsController.getAllClient); // GET /news/client/:page

router.get("/:id", newsController.getById); // GET /news/:id

router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 5 }, // Cambia el número según el límite de imágenes permitido
    { name: "pdf", maxCount: 1 },
  ]),
  newsController.addNew
); // POST /news

router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "pdf", maxCount: 1 },
  ]),
  newsController.updateNew
); // PUT /news/:id

router.delete("/:id", newsController.deleteNew); // DELETE /news/:id

export default router;
