// Tipos centralizados para todas las entidades

export type User = {
  id: number;
  username: string;
  nombre: string;
  rol: string;
};

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  message: string;
}

// Tipos de comunicación
export interface Comunicacion {
  id_comunicacion?: number;
  folio: string;
  tipo: 'Queja' | 'Sugerencia' | 'Reconocimiento';
  id_usuario?: number | null;
  id_categoria: number;
  descripcion: string;
  fecha_recepcion?: string;
  area_involucrada?: string;
  mostrar_publico?: boolean;  // Para reconocimientos: indica si se muestra en la página pública
}

export interface ComunicacionCreate {
  tipo: 'Queja' | 'Sugerencia' | 'Reconocimiento';
  id_usuario?: number | null;
  id_categoria: number;
  descripcion: string;
  area_involucrada?: string;
  medio?: 'F' | 'D';
  correo?: string; // Correo para asociar el folio en la base de datos
  anonimo?: boolean; // Si es true, no se crea/usuario (id_usuario = null)
  // Datos completos del usuario para guardar/actualizar
  usuario?: {
    nombre?: string;
    telefono?: string;
    semestre_area?: string;
    tipo_usuario?: 'Estudiante' | 'Docente' | 'Administrativo' | 'Servicios Generales';
    sexo?: 'Mujer' | 'Hombre' | 'Prefiero no responder';
    confidencial?: boolean;
    autorizo_contacto?: boolean;
  };
  propuesta_mejora?: string; // Para quejas y sugerencias
}

// Tipos de usuario
export interface Usuario {
  id_usuario?: number;
  nombre: string;
  correo: string;
  telefono: string;
  semestre_area: string;
  tipo_usuario: 'Estudiante' | 'Docente' | 'Administrativo' | 'Servicios Generales';
  sexo: 'Mujer' | 'Hombre' | 'Prefiero no responder';
  confidencial?: boolean;
  autorizo_contacto?: boolean;
}

// Tipos de categoría
export interface Categoria {
  id_categoria?: number;
  nombre_categoria: string;
}

// Tipos de estado
export type UsuarioSession = {
  id_usuario: number | null; // null para sesiones anónimas (sin registro en BD)
  correo: string;
  nombre?: string;
};

export interface Estado {
  id_estado?: number;
  nombre_estado: string;
}

// Tipos de seguimiento
export interface Seguimiento {
  id_seguimiento?: number;
  id_comunicacion: number;
  id_estado: number;
  id_miembro?: number | null;
  responsable?: string;
  fecha_actualizacion?: string;
  fecha_resolucion?: string | null;
  notas?: string;
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
}

// Tipos de evidencia
export interface Evidencia {
  id_evidencia?: number;
  id_comunicacion: number;
  tipo_archivo: 'PDF' | 'JPG' | 'PNG' | 'DOCX' | 'XLSX' | 'MP4';
  nombre_archivo: string;
  ruta_archivo: string; // Ruta local o URL de Cloudinary
  tamano_bytes?: number;
  hash_sha256?: string;
  fecha_subida?: string;
  cloudinary_url?: string; // URL de Cloudinary (opcional)
  cloudinary_public_id?: string; // Public ID de Cloudinary (opcional)
}

// Tipos de comisión
export interface Comision {
  id_miembro?: number;
  nombre: string;
  rol: 'Presidente' | 'Secretario Técnico' | 'Representante Docente' | 'Representante Estudiantil' | 'Representante Administrativo';
  periodo_inicio?: string;
  periodo_fin?: string;
}

// Tipos de folio
export interface Folio {
  id_folio?: number;
  medio: 'F' | 'D';
  anio: number;
  consecutivo: number;
}

// Tipos de historial de estados
export interface HistorialEstado {
  id_historial?: number;
  id_comunicacion: number;
  id_estado: number;
  responsable?: string;
  fecha_actualizacion?: string;
  notas?: string;
}

// Tipos de configuración
export interface ConfigData {
  nombreSistema: string;
  emailContacto: string;
  tiempoRespuesta: number;
  notificacionesEmail: boolean;
}

