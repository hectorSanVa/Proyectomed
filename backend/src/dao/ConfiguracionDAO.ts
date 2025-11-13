import pool from '../config/database';
import { Configuracion } from '../models/Configuracion';

export class ConfiguracionDAO {
  // Obtener todas las configuraciones
  static async getAll(): Promise<Configuracion[]> {
    const result = await pool.query(
      'SELECT * FROM configuracion ORDER BY clave'
    );
    return result.rows;
  }

  // Obtener configuración por clave
  static async getByClave(clave: string): Promise<Configuracion | null> {
    const result = await pool.query(
      'SELECT * FROM configuracion WHERE clave = $1',
      [clave]
    );
    return result.rows[0] || null;
  }

  // Obtener configuración como objeto simple
  static async getConfigData(): Promise<{
    nombreSistema: string;
    emailContacto: string;
    tiempoRespuesta: number;
    notificacionesEmail: boolean;
  }> {
    const configs = await this.getAll();
    const configMap = new Map<string, string>();
    configs.forEach(config => {
      configMap.set(config.clave, config.valor);
    });

    return {
      nombreSistema: configMap.get('nombre_sistema') || 'Buzón de Quejas, Sugerencias y Reconocimientos',
      emailContacto: configMap.get('email_contacto') || 'quejasysugerenciasfmht@unach.mx',
      tiempoRespuesta: parseInt(configMap.get('tiempo_respuesta') || '10', 10),
      notificacionesEmail: configMap.get('notificaciones_email') === 'true',
    };
  }

  // Actualizar o crear configuración
  static async upsert(config: Configuracion, actualizadoPor?: string): Promise<Configuracion> {
    const existing = await this.getByClave(config.clave);
    
    if (existing) {
      // Actualizar
      const result = await pool.query(
        `UPDATE configuracion 
         SET valor = $1, descripcion = $2, fecha_actualizacion = CURRENT_TIMESTAMP, actualizado_por = $3
         WHERE clave = $4
         RETURNING *`,
        [config.valor, config.descripcion || existing.descripcion, actualizadoPor || 'Sistema', config.clave]
      );
      return result.rows[0];
    } else {
      // Crear
      const result = await pool.query(
        `INSERT INTO configuracion (clave, valor, descripcion, actualizado_por)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [config.clave, config.valor, config.descripcion, actualizadoPor || 'Sistema']
      );
      return result.rows[0];
    }
  }

  // Actualizar múltiples configuraciones
  static async updateConfigData(
    data: {
      nombreSistema: string;
      emailContacto: string;
      tiempoRespuesta: number;
      notificacionesEmail: boolean;
    },
    actualizadoPor?: string
  ): Promise<void> {
    await this.upsert({
      clave: 'nombre_sistema',
      valor: data.nombreSistema,
      descripcion: 'Nombre del sistema',
    }, actualizadoPor);

    await this.upsert({
      clave: 'email_contacto',
      valor: data.emailContacto,
      descripcion: 'Email de contacto para comunicaciones',
    }, actualizadoPor);

    await this.upsert({
      clave: 'tiempo_respuesta',
      valor: data.tiempoRespuesta.toString(),
      descripcion: 'Tiempo de respuesta esperado en días hábiles',
    }, actualizadoPor);

    await this.upsert({
      clave: 'notificaciones_email',
      valor: data.notificacionesEmail.toString(),
      descripcion: 'Habilitar notificaciones por email',
    }, actualizadoPor);
  }
}

