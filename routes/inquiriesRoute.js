import express from "express";
import inquiriesController from "../controllers/InquiriesController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", inquiriesController.getAllInquiries);

router.post("/addInquiry", upload.any(), inquiriesController.addInquiry);

export default router;
