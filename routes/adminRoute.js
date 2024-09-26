import express from "express";
import AdminController from "../controllers/adminController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", AdminController.getAll); // GET /admins

router.put("/:id", upload.none(), AdminController.update); // PUT /admins/:id

router.post("/", upload.none(), AdminController.addAdmin); // POST /admins

export default router;
