import express from "express";
import loginController from "../controllers/loginController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.post("/", upload.none(), loginController.getUser); // POST /login

router.post("/company", upload.none(), loginController.loginEmpresa); // POST /login/company

export default router;
