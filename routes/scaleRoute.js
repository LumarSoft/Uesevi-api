import express from "express";
import scaleController from "../controllers/scaleController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", scaleController.getAll);

router.delete("/delete/:id", scaleController.delete);

router.put("/update-escala/:id", upload.any(), scaleController.update);

router.post(
  "/create",
  upload.fields([
    {
      name: "pdf",
      maxCount: 1,
    },
  ]),
  scaleController.create
);

export default router;
