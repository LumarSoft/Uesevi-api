import express from "express";
import dashboardController from "../controllers/dashboardController.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", requireRole("admin"), dashboardController.getAll); // GET /dashboard

export default router;
