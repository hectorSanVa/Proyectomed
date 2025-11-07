import { Request, Response } from "express";
import { EvidenciaService } from "../services/EvidenciaService";
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
        // Eliminar archivo si falta id_comunicacion
        fs.unlinkSync(file.path);
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
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: "Tipo de archivo no válido" });
      }

      // Calcular hash SHA256 del archivo
      const fileBuffer = fs.readFileSync(file.path);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Crear evidencia (ruta relativa para servir desde /uploads)
      const rutaRelativa = path.relative(path.join(__dirname, '../../uploads'), file.path);
      const rutaParaServir = path.join('uploads', rutaRelativa).replace(/\\/g, '/');
      
      const evidenciaData = {
        id_comunicacion: Number(id_comunicacion),
        tipo_archivo: tipoArchivo,
        nombre_archivo: file.originalname,
        ruta_archivo: file.path, // Ruta absoluta para acceso del servidor
        tamano_bytes: file.size,
        hash_sha256: hash,
      };

      const data = await EvidenciaService.create(evidenciaData);
      res.status(201).json(data);
    } catch (error) {
      // Limpiar archivo en caso de error
      if (req.file) {
        fs.unlinkSync(req.file.path);
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

      // Eliminar archivo del sistema de archivos
      if (fs.existsSync(evidencia.ruta_archivo)) {
        fs.unlinkSync(evidencia.ruta_archivo);
      }

      const deleted = await EvidenciaService.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Evidencia no encontrada" });
      }
      res.json({ message: "Evidencia eliminada correctamente" });
    } catch (error) {
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

      if (!fs.existsSync(evidencia.ruta_archivo)) {
        return res.status(404).json({ error: "Archivo no encontrado en el servidor" });
      }

      res.download(evidencia.ruta_archivo, evidencia.nombre_archivo);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
