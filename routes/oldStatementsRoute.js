import express from "express";
import oldStatementsController from "../controllers/oldStatementsController.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Sección "Antiguas": solo la usa el admin (ver front src/app/admin/(sidebar)/antiguas).
router.use(requireRole("admin"));

router.get("/", oldStatementsController.getAll); // GET /old-statements

router.get("/:id", oldStatementsController.getOne); // GET /old-statements/:id

router.get("/info/:idCompany/:idStatement", oldStatementsController.getInfo); // GET /old-statements/info/:idEmpresa/:idDeclaracion

export default router;
