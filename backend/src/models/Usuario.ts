export interface Usuario {
  id_usuario?: number;
  nombre?: string | null;
  correo: string;
  telefono?: string | null;
  semestre_area?: string | null;
  tipo_usuario?: "Estudiante" | "Docente" | "Administrativo" | "Servicios Generales" | null;
  sexo?: "Mujer" | "Hombre" | "Prefiero no responder" | null;
  confidencial?: boolean;
  autorizo_contacto?: boolean;
}
