import express from "express";
import loginController from "../controllers/loginController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.post("/", upload.none(), loginController.getUser); // POST /login

router.post("/company", upload.none(), loginController.loginEmpresa); // POST /login/company

router.post("/password/company/request-reset", upload.none(), loginController.requestPasswordReset); // Solicitar código

router.post("/password/company/verify-code", upload.none(), loginController.verifyResetCode); // Verificar código

router.post("/password/company/reset", upload.none(), loginController.resetPassword); // Cambiar contraseña

export default router;
