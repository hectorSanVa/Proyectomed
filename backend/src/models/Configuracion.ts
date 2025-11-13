export interface Configuracion {
  id_config?: number;
  clave: string;
  valor: string;
  descripcion?: string;
  fecha_actualizacion?: Date;
  actualizado_por?: string;
}

export interface ConfigData {
  nombreSistema: string;
  emailContacto: string;
  tiempoRespuesta: number;
  notificacionesEmail: boolean;
}

