import express from "express";
import contractsController from "../controllers/contractsController.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", requireRole("admin"), contractsController.getAll); // GET /contracts

export default router;
