import newsModel from "../models/newsModel.js";

// Función de manejo de errores
const handleError = (
  res,
  error,
  statusCode = 500,
  defaultMessage = "Error interno del servidor"
) => {
  console.error("Error en el controlador:", error);
  res.status(statusCode).json({
    ok: false,
    status: "error",
    statusCode,
    message: defaultMessage,
    error: error?.message || null,
  });
};

// Función de respuesta estándar
const response = (res, data, statusCode = 200, message = "Éxito") => {
  res.status(statusCode).json({
    ok: true,
    status: "success",
    statusCode,
    message,
    data,
  });
};

const newsController = {
  getAll: async (req, res) => {
    try {
      const news = await newsModel.getAll();
      response(res, news, 200, "Noticias obtenidas con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getLastThree: async (req, res) => {
    try {
      const latestNews = await newsModel.getLastThree(); // Asegúrate de que este método obtenga las últimas noticias correctamente
      response(res, latestNews, 200, "Últimas tres noticias obtenidas con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  getAllClient: async (req, res) => {
    try {
      const { page = 1 } = req.params;
      const limit = 12;
      const offset = (page - 1) * limit;

      const noticias = await newsModel.getAllClient(offset, limit);
      response(res, noticias, 200, "Noticias obtenidas para el cliente");
    } catch (error) {
      handleError(res, error);
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const news = await newsModel.getById(id);
      response(res, news, 200, "Noticia obtenida con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },

  addNew: async (req, res) => {
    try {
      const { headline, epigraph, body, body2, addressee } = req.body;

      // Validar que se proporcionen los campos obligatorios
      if (!headline || !body || !addressee) {
        const error = new Error("Faltan campos obligatorios");
        error.httpStatus = 400;
        throw error;
      }

      // Guardar solo el nombre del archivo
      const images = req.files["images"]
        ? req.files["images"].map((file) => file.filename)
        : [];
      const pdf = req.files["pdf"] ? req.files["pdf"][0].filename : null;

      const result = await newsModel.addNew({
        headline,
        epigraph,
        body,
        body2,
        addressee,
        images,
        pdf,
      });

      response(res, result, 201, "Noticia agregada con éxito");
    } catch (error) {
      handleError(res, error, error.httpStatus || 500);
    }
  },

  updateNew: async (req, res) => {
    try {
      const { headline, epigraph, body, body2, addressee } = req.body;
      const newId = req.params.id;

      // Procesa las imágenes nuevas
      const newImages = req.files["images"]
        ? req.files["images"].map((file) => file.filename)
        : [];

      // Obtén las imágenes existentes
      const existingNew = await newsModel.getById(newId);
      const existingImages = existingNew.images || [];

      // Reemplaza o conserva imágenes según corresponda
      const images = newImages.length > 0 ? newImages : existingImages;

      // Procesa el PDF
      const pdf = req.files["pdf"]
        ? req.files["pdf"][0].filename
        : existingNew.pdf;

      const result = await newsModel.updateNew({
        id: newId,
        headline,
        epigraph,
        body,
        body2,
        addressee,
        images,
        pdf,
      });

      response(res, result, 200, "Noticia actualizada con éxito");
    } catch (error) {
      handleError(res, error, error.httpStatus || 500);
    }
  },

  deleteNew: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await newsModel.deleteNew(id);
      response(res, result, 200, "Noticia eliminada con éxito");
    } catch (error) {
      handleError(res, error);
    }
  },
};

export default newsController;
