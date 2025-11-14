export interface Evidencia {
  id_evidencia?: number;
  id_comunicacion: number;
  tipo_archivo: "PDF" | "JPG" | "PNG" | "DOCX" | "XLSX" | "MP4";
  nombre_archivo: string;
  ruta_archivo: string; // Ruta local o URL de Cloudinary
  tamano_bytes?: number;
  hash_sha256?: string;
  fecha_subida?: string;  // ISO timestamp
  cloudinary_url?: string; // URL de Cloudinary (opcional, para compatibilidad)
  cloudinary_public_id?: string; // Public ID de Cloudinary (para eliminación)
}
