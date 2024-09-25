import express from "express";
import oldCompaniesController from "../controllers/oldCompaniesController.js";

const router = express.Router();

router.get("/", oldCompaniesController.getAll);

export default router;
