import express from "express";
import scaleController from "../controllers/scaleController.js";
import upload from "../multerconfig.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", scaleController.getAll); // GET /scales

router.get("/clients", scaleController.getAllClient); // GET /scales/clients

router.delete("/:id", requireRole("admin"), scaleController.delete); // DELETE /scales/:id

router.put("/:id", requireRole("admin"), upload.any(), scaleController.update); // PUT /scales/:id

router.post(
  "/",
  requireRole("admin"),
  upload.fields([
    {
      name: "pdf",
      maxCount: 1,
    },
  ]),
  scaleController.create
); // POST /scales

export default router;
