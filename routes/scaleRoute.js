import express from "express";
import scaleController from "../controllers/scaleController.js";
import upload from "../multerconfig.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/clients", scaleController.getAllClient); // GET /scales/clients

router.get("/", authRequired, requireRole("admin"), scaleController.getAll); // GET /scales

router.delete(
  "/:id",
  authRequired,
  requireRole("admin"),
  scaleController.delete
); // DELETE /scales/:id

router.put(
  "/:id",
  authRequired,
  requireRole("admin"),
  upload.any(),
  scaleController.update
); // PUT /scales/:id

router.post(
  "/",
  authRequired,
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
