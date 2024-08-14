import express from "express";
import escalasController from "../controllers/escalasController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", escalasController.getAll);

router.delete("/delete/:id", escalasController.delete);

router.put("/update-escala/:id", upload.any(), escalasController.update);

router.post(
  "/create",
  upload.fields([
    {
      name: "pdf",
      maxCount: 1,
    },
  ]),
  escalasController.create
);

export default router;
