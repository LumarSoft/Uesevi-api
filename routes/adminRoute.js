import express from "express";
import AdminController from "../controllers/adminController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", AdminController.getAll);

router.put("/update-admin/:id", upload.any(), AdminController.update);

router.post("/add-admin", upload.any(), AdminController.addAdmin);

export default router;
