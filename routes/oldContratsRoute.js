import express from "express";
import oldContractsController from "../controllers/oldContractsController.js";

const router = express.Router();

router.get("/", oldContractsController.getAll);

export default router;
