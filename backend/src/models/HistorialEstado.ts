export interface HistorialEstado {
  id_historial: number;
  id_comunicacion: number;
  id_estado: number;
  responsable: string;
  fecha_actualizacion: string; // timestamp
  notas: string;
}
