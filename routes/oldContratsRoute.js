import express from "express";
import oldContractsController from "../controllers/oldContractsController.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", requireRole("admin"), oldContractsController.getAll); // GET /old-contracts

export default router;
