import express from "express";
import newsController from "../controllers/news.js";

const router = express.Router();

router.get("/", newsController.getLatest);

export default router;
