import express from "express";
import dashboardController from "../controllers/dashboard.js";

const router = express.Router();

router.get("/", dashboardController.getAll);

export default router;