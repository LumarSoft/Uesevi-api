import express from "express";
import statementsController from "../controllers/statementsController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", statementsController.getAll);

router.get("/:id", statementsController.getOne);

router.get("/getInfo/:idEmpresa/:idDeclaracion", statementsController.getInfo);

router.get("/history/:idEmpresa/:year/:month", statementsController.getHistory);

router.put("/changeState/:id", upload.any(), statementsController.changeState);

router.put(
  "/changeDatePayment/:id",
  upload.any(),
  statementsController.changeDatePayment
);

export default router;
