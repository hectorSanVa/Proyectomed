export interface Seguimiento {
  id_seguimiento: number;
  id_comunicacion: number;
  id_estado: number;
  id_miembro: number;
  responsable: string;
  fecha_actualizacion: string;
  fecha_resolucion: string | null;
  notas: string;
  prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente';
}
