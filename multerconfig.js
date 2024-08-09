import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Función para asegurar que el directorio exista
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

// Función para verificar si el archivo ya existe
const fileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];
    let folder = 'uploads';

    if (fileType === 'image') {
      folder = 'uploads/imagenes-noticia';
    } else if (fileType === 'application') {
      folder = 'uploads/archivos-noticia';
    }

    // Asegurarse de que el directorio exista
    ensureDirectoryExistence(path.join(folder, file.originalname));

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const filePath = path.join('uploads', file.originalname);
    
    // Verificar si el archivo ya existe y generar un nombre único si es necesario
    let uniqueFileName = file.originalname;
    let counter = 1;
    while (fileExists(path.join('uploads', uniqueFileName))) {
      uniqueFileName = file.originalname.replace(/(\.[\w\d_-]+)$/i, `-${counter++}$1`);
    }

    cb(null, uniqueFileName);
  },
});

const upload = multer({ storage });

export default upload;
