import express from "express";
import AdminController from "../controllers/adminController.js";
import upload from "../multerconfig.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", requireRole("admin"), AdminController.getAll); // GET /admins

router.put("/:id", requireRole("admin"), upload.none(), AdminController.update); // PUT /admins/:id

router.post("/", requireRole("admin"), upload.none(), AdminController.addAdmin); // POST /admins

export default router;
