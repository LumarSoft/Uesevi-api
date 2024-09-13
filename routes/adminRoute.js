import express from "express";
import AdminController from "../controllers/adminController.js";

const router = express.Router();

router.get("/", AdminController.getAll);

router.put("/update-admin/:id", AdminController.update);

router.post("/add-admin", AdminController.addAdmin);

export default router;
