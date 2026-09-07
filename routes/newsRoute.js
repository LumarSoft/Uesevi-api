import express from "express";
import newsController from "../controllers/newsController.js";
import upload from "../multerconfig.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// ---- Públicas ----
router.get("/", newsController.getAll); // GET /news

router.get("/last-three", newsController.getLastThree); // GET /news/last-three

router.get("/client/:page", newsController.getAllClient); // GET /news/client/:page

router.get("/:id", newsController.getById); // GET /news/:id

// ---- Solo admin ----
router.post(
  "/",
  authRequired,
  requireRole("admin"),
  upload.fields([
    { name: "images", maxCount: 5, limits: { fileSize: 5 * 1024 * 1024 } }, // Cambia el número según el límite de imágenes permitido
    { name: "pdf", maxCount: 1, limits: { fileSize: 10 * 1024 * 1024 } },
  ]),
  newsController.addNew
);

router.put(
  "/:id",
  authRequired,
  requireRole("admin"),
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "pdf", maxCount: 1 },
  ]),
  newsController.updateNew
); // PUT /news/:id

router.delete("/:id", authRequired, requireRole("admin"), newsController.deleteNew); // DELETE /news/:id

export default router;
