import express from "express";
import rateController from "../controllers/rateController.js";

const router = express.Router();

router.get("/", rateController.getAll);

router.put("/update-rate/:id", rateController.update);

export default router;
