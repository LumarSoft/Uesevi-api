import express from "express";
import formController from "../controllers/formController.js";

const router = express.Router();

router.get("/", formController.getAll);

router.put("/change-empresa/:id", formController.changeCompany);

export default router;
