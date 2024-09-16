import express from "express";
import companiesController from "../controllers/companiesController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", companiesController.getAll);

router.put("/change-state/:id", upload.any(), companiesController.changeState);

router.delete("/delete/:id", companiesController.delete);

export default router;
