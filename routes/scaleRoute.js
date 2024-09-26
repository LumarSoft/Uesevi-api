import express from "express";
import scaleController from "../controllers/scaleController.js";
import upload from "../multerconfig.js";

const router = express.Router();

router.get("/", scaleController.getAll); // GET /scales

router.get("/clients", scaleController.getAllClient); // GET /scales/clients

router.delete("/:id", scaleController.delete); // DELETE /scales/:id

router.put("/:id", upload.any(), scaleController.update); // PUT /scales/:id

router.post(
  "/",
  upload.fields([
    {
      name: "pdf",
      maxCount: 1,
    },
  ]),
  scaleController.create
); // POST /scales

export default router;
