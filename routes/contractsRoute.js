import express from "express";
import contractsController from "../controllers/contractsController.js";

const router = express.Router();

router.get("/", contractsController.getAll); // GET /contracts

export default router;
