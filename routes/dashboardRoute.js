import express from "express";
import dashboardController from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", dashboardController.getAll); // GET /dashboard

export default router;
