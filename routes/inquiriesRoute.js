import express from "express";
import inquiriesController from "../controllers/InquiriesController.js";
import upload from "../multerconfig.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authRequired, requireRole("admin"), inquiriesController.getAllInquiries); // GET /inquiries

router.post("/", upload.any(), inquiriesController.addInquiry); // POST /inquiries (público, formulario de contacto)

export default router;
