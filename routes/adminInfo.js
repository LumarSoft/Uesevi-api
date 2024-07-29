import express from "express";
import usuariosAdminController from "../controllers/adminInfo.js";

const router = express.Router();

router.get("/", usuariosAdminController.getAll);
router.put("/update-admin/:id", usuariosAdminController.update);

router.post("/add-admin", usuariosAdminController.addAdmin);
export default router;
