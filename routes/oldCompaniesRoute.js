import express from "express";
import oldCompaniesController from "../controllers/oldCompaniesController.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", requireRole("admin"), oldCompaniesController.getAll); // GET /old-companies

export default router;
