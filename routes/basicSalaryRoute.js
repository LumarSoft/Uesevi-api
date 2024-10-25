import express from "express";
import basicSalaryController from "../controllers/basicSalaryController.js";

const router = express.Router();

router.get("/", basicSalaryController.getBasicSalary);

export default router;
