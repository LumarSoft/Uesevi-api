import express from "express";
import declaracionesController from "../controllers/declaraciones.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", declaracionesController.getAll);

router.get("/:id", declaracionesController.getOne);

router.put(
  "/changeState/:id",
  upload.any(),
  declaracionesController.changeState
);

export default router;
