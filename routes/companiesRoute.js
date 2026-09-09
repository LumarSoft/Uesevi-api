import express from "express";
import companiesController from "../controllers/companiesController.js";
import upload from "../multerconfig.js";
import { authRequired, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// Alta pública de empresas. Las demás operaciones requieren administrador.
router.post("/", upload.none(), companiesController.create); // POST /companies

router.get("/", authRequired, requireRole("admin"), companiesController.getAll); // GET /companies

router.get(
  "/inPending",
  authRequired,
  requireRole("admin"),
  companiesController.getInPending
);

router.put(
  "/:id/state",
  authRequired,
  requireRole("admin"),
  upload.any(),
  companiesController.changeState
); // PUT /companies/:id/state

router.delete(
  "/:id",
  authRequired,
  requireRole("admin"),
  companiesController.delete
); // DELETE /companies/:id

export default router;
