import express from "express";
import categoryController from "../controllers/categoryController.js";
import upload from "../multerconfig.js";
import { requireRole } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", categoryController.getAll); // GET /categories

router.post("/", requireRole("admin"), upload.none(), categoryController.addCategory); // POST /categories

router.delete("/:id", requireRole("admin"), categoryController.deleteCategory); // DELETE /categories/:id

router.put("/:id", requireRole("admin"), upload.none(), categoryController.editCategory); // PUT /categories/:id

router.put(
  "/:id/future-salary",
  requireRole("admin"),
  upload.none(),
  categoryController.futureSalary
); // PUT /categories/:id/future-salary

router.get("/update-now", requireRole("admin"), upload.none(), categoryController.updateNow); // PUT /categories/update-now

export default router;
