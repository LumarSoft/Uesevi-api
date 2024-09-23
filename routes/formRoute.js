import express from "express";
import formController from "../controllers/formController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", formController.getAll);

router.put("/change-company/:id", upload.any(), formController.changeCompany);

router.get("/get-to-complete/:cuil", upload.any(), formController.getToComplete);

export default router;
