export interface Usuario {
  id_usuario?: number;
  nombre: string;
  correo: string;
  telefono: string;
  semestre_area: string;
  tipo_usuario: "Estudiante" | "Docente" | "Administrativo" | "Servicios Generales";
  sexo: "Mujer" | "Hombre" | "Prefiero no responder";
  confidencial?: boolean;
  autorizo_contacto?: boolean;
}
