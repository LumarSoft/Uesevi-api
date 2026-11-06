import express from "express";
import salaryCompositionController from "../controllers/salaryCompositionController.js";
import upload from "../multerconfig.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// ---- Pública (la consume la sección "Salario del mes" de la home) ----
router.get("/public", salaryCompositionController.getPublic); // GET /salary-composition/public

// ---- Solo admin ----
router.get(
  "/",
  authRequired,
  requireRole("admin"),
  salaryCompositionController.getAll
); // GET /salary-composition

router.get(
  "/:id",
  authRequired,
  requireRole("admin"),
  salaryCompositionController.getById
); // GET /salary-composition/:id

router.post(
  "/",
  authRequired,
  requireRole("admin"),
  upload.none(),
  salaryCompositionController.create
); // POST /salary-composition

router.put(
  "/:id",
  authRequired,
  requireRole("admin"),
  upload.none(),
  salaryCompositionController.update
); // PUT /salary-composition/:id

router.delete(
  "/:id",
  authRequired,
  requireRole("admin"),
  salaryCompositionController.delete
); // DELETE /salary-composition/:id

export default router;
