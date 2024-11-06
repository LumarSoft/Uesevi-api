import express from "express";
import categoryController from "../controllers/categoryController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", categoryController.getAll); // GET /categories

router.post("/", upload.none(), categoryController.addCategory); // POST /categories

router.delete("/:id", categoryController.deleteCategory); // DELETE /categories/:id

router.put("/:id", upload.none(), categoryController.editCategory); // PUT /categories/:id

router.put(
  "/:id/future-salary",
  upload.none(),
  categoryController.futureSalary
); // PUT /categories/:id/future-salary

router.get("/update-now", upload.none(), categoryController.updateNow); // PUT /categories/update-now

export default router;
