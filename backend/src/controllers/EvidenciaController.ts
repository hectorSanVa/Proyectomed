import { Request, Response } from "express";
import { EvidenciaService } from "../services/EvidenciaService";
import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from "../services/cloudinaryService";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export class EvidenciaController {
  static async getAll(req: Request, res: Response) {
    try {
      const data = await EvidenciaService.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await EvidenciaService.getById(id);
      if (!data)
        return res.status(404).json({ error: "Evidencia no encontrada" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No se proporcionó ningún archivo" });
      }

      const { id_comunicacion } = req.body;
      if (!id_comunicacion) {
        // Limpiar archivo si falta id_comunicacion
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({ error: "id_comunicacion es requerido" });
      }

      // Obtener extensión y mapear a tipo
      const ext = path.extname(file.originalname).toUpperCase().replace('.', '');
      const extMap: { [key: string]: "PDF" | "JPG" | "PNG" | "DOCX" | "XLSX" | "MP4" } = {
        'PDF': 'PDF',
        'JPG': 'JPG',
        'JPEG': 'JPG',
        'PNG': 'PNG',
        'DOCX': 'DOCX',
        'XLSX': 'XLSX',
        'MP4': 'MP4',
      };

      const tipoArchivo = extMap[ext];
      if (!tipoArchivo) {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({ error: "Tipo de archivo no válido" });
      }

      let rutaArchivo: string;
      let cloudinaryUrl: string | undefined;
      let cloudinaryPublicId: string | undefined;
      let fileBuffer: Buffer;
      let hash: string;

      // Obtener buffer del archivo
      if (file.buffer) {
        // Cloudinary: usar buffer de memoria
        fileBuffer = file.buffer;
      } else if (file.path) {
        // Modo local: leer del disco
        fileBuffer = fs.readFileSync(file.path);
      } else {
        throw new Error('No se pudo obtener el archivo');
      }

      // Calcular hash SHA256 del archivo
      hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Si Cloudinary está configurado, subir allí
      if (isCloudinaryConfigured()) {
        try {
          console.log('📤 Subiendo archivo a Cloudinary:', file.originalname);
          const cloudinaryResult = await uploadToCloudinary(
            fileBuffer,
            file.originalname,
            `buzon-unach/evidencias/comunicacion-${id_comunicacion}`
          );
          
          rutaArchivo = cloudinaryResult.secure_url; // Usar URL de Cloudinary como ruta
          cloudinaryUrl = cloudinaryResult.secure_url;
          cloudinaryPublicId = cloudinaryResult.public_id;
          
          console.log('✅ Archivo subido a Cloudinary:', cloudinaryResult.secure_url);
          
          // Eliminar archivo temporal si existe (no debería existir en modo Cloudinary)
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (cloudinaryError: any) {
          console.error('❌ Error al subir a Cloudinary:', cloudinaryError);
          // Si falla Cloudinary y hay archivo local, usar el archivo local
          if (file.path && fs.existsSync(file.path)) {
            console.log('⚠️ Usando almacenamiento local como fallback');
            rutaArchivo = file.path;
          } else {
            throw new Error(`Error al subir archivo: ${cloudinaryError.message}`);
          }
        }
      } else {
        // Modo local: usar ruta del archivo
        console.log('📁 Guardando archivo localmente:', file.path);
        rutaArchivo = file.path;
      }
      
      const evidenciaData = {
        id_comunicacion: Number(id_comunicacion),
        tipo_archivo: tipoArchivo,
        nombre_archivo: file.originalname,
        ruta_archivo: rutaArchivo,
        tamano_bytes: file.size,
        hash_sha256: hash,
        cloudinary_url: cloudinaryUrl,
        cloudinary_public_id: cloudinaryPublicId,
      };

      const data = await EvidenciaService.create(evidenciaData);
      res.status(201).json(data);
    } catch (error) {
      console.error('❌ Error en create evidencia:', error);
      // Limpiar archivo en caso de error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('⚠️ Error al eliminar archivo temporal:', unlinkError);
        }
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await EvidenciaService.update(id, req.body);
      if (!data)
        return res.status(404).json({ error: "Evidencia no encontrada" });
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const evidencia = await EvidenciaService.getById(id);
      if (!evidencia) {
        return res.status(404).json({ error: "Evidencia no encontrada" });
      }

      // Eliminar de Cloudinary si existe
      if (evidencia.cloudinary_public_id && isCloudinaryConfigured()) {
        try {
          console.log('🗑️ Eliminando de Cloudinary:', evidencia.cloudinary_public_id);
          // Determinar el tipo de recurso basado en la extensión
          const ext = evidencia.nombre_archivo.split('.').pop()?.toLowerCase() || '';
          const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
          const videoExts = ['mp4', 'webm', 'mov', 'avi'];
          
          let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
          if (imageExts.includes(ext)) {
            resourceType = 'image';
          } else if (videoExts.includes(ext)) {
            resourceType = 'video';
          } else {
            resourceType = 'raw';
          }
          
          await deleteFromCloudinary(evidencia.cloudinary_public_id, resourceType);
          console.log('✅ Archivo eliminado de Cloudinary');
        } catch (cloudinaryError: any) {
          console.error('⚠️ Error al eliminar de Cloudinary (continuando):', cloudinaryError.message);
          // Continuar aunque falle la eliminación de Cloudinary
        }
      } else {
        // Eliminar archivo del sistema de archivos (modo local)
        // Solo si la ruta es un path local y no una URL
        if (evidencia.ruta_archivo && !evidencia.ruta_archivo.startsWith('http')) {
          if (fs.existsSync(evidencia.ruta_archivo)) {
            try {
              fs.unlinkSync(evidencia.ruta_archivo);
              console.log('✅ Archivo local eliminado');
            } catch (unlinkError: any) {
              console.error('⚠️ Error al eliminar archivo local:', unlinkError.message);
            }
          }
        }
      }

      const deleted = await EvidenciaService.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Evidencia no encontrada" });
      }
      res.json({ message: "Evidencia eliminada correctamente" });
    } catch (error) {
      console.error('❌ Error en delete evidencia:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getByComunicacion(req: Request, res: Response) {
    try {
      const idComunicacion = Number(req.params.idComunicacion);
      const evidencias = await EvidenciaService.getByComunicacionId(idComunicacion);
      res.json(evidencias);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async download(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const evidencia = await EvidenciaService.getById(id);
      if (!evidencia) {
        return res.status(404).json({ error: "Evidencia no encontrada" });
      }

      // Si tiene URL de Cloudinary, redirigir allí
      if (evidencia.cloudinary_url || evidencia.ruta_archivo.startsWith('http')) {
        const url = evidencia.cloudinary_url || evidencia.ruta_archivo;
        console.log('🔗 Redirigiendo a Cloudinary:', url);
        return res.redirect(url);
      }

      // Modo local: descargar desde el servidor
      if (!fs.existsSync(evidencia.ruta_archivo)) {
        return res.status(404).json({ error: "Archivo no encontrado en el servidor" });
      }

      res.download(evidencia.ruta_archivo, evidencia.nombre_archivo);
    } catch (error) {
      console.error('❌ Error en download evidencia:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
