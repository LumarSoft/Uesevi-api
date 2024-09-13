import express from "express";
import oldStatementsController from "../controllers/oldStatementsController.js";

const router = express.Router();

router.get("/", oldStatementsController.getAll);

router.get("/:id", oldStatementsController.getOne);

router.get(
  "/getInfo/:idEmpresa/:idDeclaracion",
  oldStatementsController.getInfo
);

export default router;
