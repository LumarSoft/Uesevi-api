import express from "express";
import rateController from "../controllers/rateController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", rateController.getAll);

router.put("/update-rate/:id", upload.any(), rateController.update);

export default router;
