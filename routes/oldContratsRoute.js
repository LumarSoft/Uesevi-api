import express from "express";
import oldContractsController from "../controllers/oldContractsController.js";

const router = express.Router();

router.get("/", oldContractsController.getAll); // GET /old-contracts

export default router;
