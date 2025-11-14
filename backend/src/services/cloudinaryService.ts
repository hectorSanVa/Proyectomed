import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

// Configurar Cloudinary (puede estar vacío si no está configurado)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Verificar si Cloudinary está configurado
const isCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Tipos de archivo permitidos en Cloudinary
export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';

/**
 * Subir archivo a Cloudinary desde buffer
 * @param fileBuffer Buffer del archivo
 * @param originalName Nombre original del archivo
 * @param folder Carpeta en Cloudinary (opcional)
 * @returns URL pública del archivo y public_id
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  originalName: string,
  folder: string = 'buzon-unach/evidencias'
): Promise<{ url: string; secure_url: string; public_id: string; resource_type: string }> => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary no está configurado. Configure las variables de entorno CLOUDINARY_*');
  }

  return new Promise((resolve, reject) => {
    // Determinar el tipo de recurso basado en la extensión
    const ext = originalName.split('.').pop()?.toLowerCase() || '';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExts = ['mp4', 'webm', 'mov', 'avi'];
    
    let resourceType: CloudinaryResourceType = 'auto';
    if (imageExts.includes(ext)) {
      resourceType = 'image';
    } else if (videoExts.includes(ext)) {
      resourceType = 'video';
    } else {
      resourceType = 'raw'; // Para PDFs, DOCX, XLSX, etc.
    }

    // Crear un stream desde el buffer
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folder,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        // Optimización para imágenes
        ...(resourceType === 'image' && {
          quality: 'auto',
          fetch_format: 'auto',
        }),
      },
      (error, result) => {
        if (error) {
          console.error('❌ Error al subir a Cloudinary:', error);
          reject(error);
        } else if (result) {
          console.log('✅ Archivo subido a Cloudinary:', {
            public_id: result.public_id,
            url: result.secure_url,
            resource_type: result.resource_type,
          });
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type || resourceType,
          });
        } else {
          reject(new Error('No se obtuvo resultado de Cloudinary'));
        }
      }
    );

    // Convertir buffer a stream y subir
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Eliminar archivo de Cloudinary
 * @param publicId Public ID del archivo en Cloudinary
 * @param resourceType Tipo de recurso (image, video, raw)
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: CloudinaryResourceType = 'auto'
): Promise<void> => {
  if (!isCloudinaryConfigured()) {
    console.warn('⚠️ Cloudinary no está configurado, no se puede eliminar el archivo');
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    console.log('✅ Archivo eliminado de Cloudinary:', publicId, result);
  } catch (error) {
    console.error('❌ Error al eliminar de Cloudinary:', error);
    throw error;
  }
};

/**
 * Obtener URL de Cloudinary (útil para transformaciones)
 * @param publicId Public ID del archivo
 * @param resourceType Tipo de recurso
 * @returns URL del archivo
 */
export const getCloudinaryUrl = (
  publicId: string,
  resourceType: CloudinaryResourceType = 'auto'
): string => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary no está configurado');
  }

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
  });
};

/**
 * Verificar si Cloudinary está configurado
 */
export { isCloudinaryConfigured };
