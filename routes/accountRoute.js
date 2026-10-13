import express from "express";
import accountController from "../controllers/accountController.js";
import upload from "../multerconfig.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Montado después de la barrera authRequired. Opera siempre sobre req.user.id:
// cada empresa sólo puede ver/editar su propia cuenta.
router.get("/", requireRole("empresa"), accountController.get); // GET /account

router.put("/email", requireRole("empresa"), upload.none(), accountController.updateEmail); // PUT /account/email

router.put("/password", requireRole("empresa"), upload.none(), accountController.updatePassword); // PUT /account/password

export default router;
