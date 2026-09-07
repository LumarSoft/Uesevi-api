import express from "express";
import basicSalaryController from "../controllers/basicSalaryController.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", requireRole("admin"), basicSalaryController.getBasicSalary);

export default router;
