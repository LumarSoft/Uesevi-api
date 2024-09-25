import express from "express";
import loginController from "../controllers/loginController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.post("/", upload.any(), loginController.getUser);

router.post("/loginEmpresa", upload.any(), loginController.loginEmpresa);

export default router;
