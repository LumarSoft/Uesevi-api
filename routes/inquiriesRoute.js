import express from "express";
import inquiriesController from "../controllers/InquiriesController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", inquiriesController.getAllInquiries); // GET /inquiries

router.post("/", upload.any(), inquiriesController.addInquiry); // POST /inquiries

export default router;
