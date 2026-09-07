import express from "express";
import formController from "../controllers/formController.js";
import upload from "../multerconfig.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// ---- Públicas ----
router.get("/complete/:cuil", formController.getToComplete); // GET /forms/complete/:cuil

router.post("/", upload.any(), formController.createRequest); // POST /forms (alta pública)

// ---- Solo admin ----
router.get("/", authRequired, requireRole("admin"), formController.getAll); // GET /forms

router.put(
  "/:id/company",
  authRequired,
  requireRole("admin"),
  upload.none(),
  formController.changeCompany
); // PUT /forms/:id/company

router.delete("/:id", authRequired, requireRole("admin"), formController.deleteRequest); // DELETE /forms/:id

export default router;
