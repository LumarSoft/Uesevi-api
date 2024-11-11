import express from "express";
import newsController from "../controllers/newsController.js";
import upload from "../multerconfig.js";
import cors from "cors";

const router = express.Router();

router.get("/", newsController.getAll); // GET /news

router.get("/last-three", newsController.getLastThree); // GET /news/last-three

router.get("/client/:page", newsController.getAllClient); // GET /news/client/:page

router.get("/:id", newsController.getById); // GET /news/:id

router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 5, limits: { fileSize: 5 * 1024 * 1024 } }, // Cambia el número según el límite de imágenes permitido
    { name: "pdf", maxCount: 1, limits: { fileSize: 10 * 1024 * 1024 } },
  ]),
  newsController.addNew
);

router.post("/test", (req, res) => {
  console.log(req.body);
  res.send("ok");
});

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
