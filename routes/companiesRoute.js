import express from "express";
import companiesController from "../controllers/companiesController.js";
import upload from "../multerconfig.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.use(requireRole("admin"));

router.get("/", companiesController.getAll); // GET /companies

router.get("/inPending", companiesController.getInPending);

router.put("/:id/state", upload.any(), companiesController.changeState); // PUT /companies/:id/state

router.delete("/:id", companiesController.delete); // DELETE /companies/:id

router.post("/", upload.none(), companiesController.create); // POST /companies

export default router;
