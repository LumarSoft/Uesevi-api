import express from "express";
import categoryController from "../controllers/categoryController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", categoryController.getAll);

router.post("/add-category", upload.any(), categoryController.addCategory);

router.delete("/delete-category/:id", categoryController.deleteCategory);

router.put(
  "/update-category/:id",
  upload.any(),
  categoryController.editCategory
);

router.put("/future-salary/:id", upload.any(), categoryController.futureSalary);

export default router;
