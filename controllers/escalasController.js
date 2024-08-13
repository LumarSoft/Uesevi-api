import escalasModel from "../models/escalasModel.js";
import multer from "multer";
import path from "path";

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/escalas");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF"));
    }
  },
});

const escalasController = {
  getAll: async (req, res, next) => {
    try {
      const escalas = await escalasModel.getAll();
      res.json(escalas);
    } catch (error) {
      next(error);
    }
  },
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      await escalasModel.delete(id);
      res.json({ message: "Archivo eliminado" });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const escalasData = req.body;
      const result = await escalasModel.update(id, escalasData);
      if (result.affectedRows > 0) {
        res.json({
          message: "Archivo actualizado",
          updatedEscala: escalasData,
        });
      } else {
        res.status(404).json({ message: "Archivo no encontrado" });
      }
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    upload.single("archivo")(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      try {
        const { nombre } = req.body;
        const archivo = req.file.filename;

        const result = await escalasModel.create({ nombre, archivo });

        res.status(201).json({
          message: "Escala creada exitosamente",
          escala: result,
        });
      } catch (error) {
        next(error);
      }
    });
  },
};
export default escalasController;
