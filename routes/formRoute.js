import express from "express";
import formController from "../controllers/formController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", formController.getAll); // GET /forms

router.put("/:id/company", upload.none(), formController.changeCompany); // PUT /forms/:id/company

router.get("/complete/:cuil", formController.getToComplete); // GET /forms/complete/:cuil

router.post("/", upload.any(), formController.createRequest); // POST /forms

export default router;
