import express from "express";
import oldStatementsController from "../controllers/oldStatementsController.js";

const router = express.Router();

router.get("/", oldStatementsController.getAll); // GET /old-statements

router.get("/:id", oldStatementsController.getOne); // GET /old-statements/:id

router.get("/info/:idCompany/:idStatement", oldStatementsController.getInfo); // GET /old-statements/info/:idEmpresa/:idDeclaracion

export default router;
