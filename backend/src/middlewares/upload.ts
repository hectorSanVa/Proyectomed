import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { isCloudinaryConfigured } from '../services/cloudinaryService';

// Crear carpeta de uploads si no existe (para modo local)
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Si Cloudinary está configurado, usar memory storage
// Si no, usar disk storage (modo local)
const storage = isCloudinaryConfigured()
  ? multer.memoryStorage() // Cloudinary: guardar en memoria temporalmente
  : multer.diskStorage({
      // Modo local: guardar en disco
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        // Generar nombre único para el archivo
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
      },
    });

// Filtro de tipos de archivo permitidos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['PDF', 'JPG', 'PNG', 'DOCX', 'XLSX', 'MP4'];
  const fileExt = path.extname(file.originalname).toUpperCase().replace('.', '');
  
  // Mapear extensiones a tipos permitidos
  const extMap: { [key: string]: string } = {
    'PDF': 'PDF',
    'JPG': 'JPG',
    'JPEG': 'JPG',
    'PNG': 'PNG',
    'DOCX': 'DOCX',
    'XLSX': 'XLSX',
    'MP4': 'MP4',
  };

  if (extMap[fileExt] && allowedTypes.includes(extMap[fileExt])) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`));
  }
};

// Configuración de multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
});


