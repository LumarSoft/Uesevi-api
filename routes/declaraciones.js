import express from "express";
import declaracionesController from "../controllers/declaraciones.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", declaracionesController.getAll);

router.get("/:id", declaracionesController.getOne);

router.get("/getInfo/:idEmpresa/:idDeclaracion", declaracionesController.getInfo);

router.get(
  "/history/:idEmpresa/:year/:month",
  declaracionesController.getHistory
);

router.put(
  "/changeState/:id",
  upload.any(),
  declaracionesController.changeState
);

router.put(
  "/changeDatePayment/:id",
  upload.any(),
  declaracionesController.changeDatePayment
);

export default router;
