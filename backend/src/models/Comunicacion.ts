export interface Comunicacion {
  id_comunicacion?: number;
  folio: string;
  tipo: "Queja" | "Sugerencia" | "Reconocimiento";
  id_usuario?: number | null;   // Puede ser null si se elimina el usuario
  id_categoria: number;
  descripcion: string;
  fecha_recepcion?: Date;
  area_involucrada?: string;
  mostrar_publico?: boolean;  // Para reconocimientos: indica si se muestra en la página pública
}
