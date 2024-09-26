import express from "express";
import rateController from "../controllers/rateController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", rateController.getAll); // GET /rates

router.put("/:id", upload.none(), rateController.update); // PUT /rates/:id

export default router;
