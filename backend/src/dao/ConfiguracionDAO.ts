import pool from '../config/database';
import { Configuracion } from '../models/Configuracion';

export class ConfiguracionDAO {
  // Verificar si la tabla existe
  static async tableExists(): Promise<boolean> {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'configuracion'
        );
      `);
      return result.rows[0]?.exists || false;
    } catch (error) {
      console.error('Error al verificar existencia de tabla configuracion:', error);
      return false;
    }
  }

  // Crear tabla y datos por defecto si no existen
  static async ensureTableAndDefaults(): Promise<void> {
    try {
      const tableExists = await this.tableExists();
      
      if (!tableExists) {
        console.log('📦 Creando tabla configuracion...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS configuracion (
            id_config SERIAL PRIMARY KEY,
            clave VARCHAR(100) UNIQUE NOT NULL,
            valor TEXT,
            descripcion TEXT,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actualizado_por VARCHAR(100)
          );
        `);
        console.log('✅ Tabla configuracion creada');
      }

      // Verificar si hay datos, si no, insertar por defecto
      const countResult = await pool.query('SELECT COUNT(*) as count FROM configuracion');
      const count = parseInt(countResult.rows[0]?.count || '0', 10);

      if (count === 0) {
        console.log('📦 Insertando configuración por defecto...');
        await pool.query(`
          INSERT INTO configuracion (clave, valor, descripcion, actualizado_por) 
          VALUES 
            ('nombre_sistema', 'Buzón de Quejas, Sugerencias y Reconocimientos', 'Nombre del sistema', 'Sistema'),
            ('email_contacto', 'quejasysugerenciasfmht@unach.mx', 'Email de contacto para comunicaciones', 'Sistema'),
            ('tiempo_respuesta', '10', 'Tiempo de respuesta esperado en días hábiles', 'Sistema'),
            ('notificaciones_email', 'true', 'Habilitar notificaciones por email', 'Sistema');
        `);
        console.log('✅ Configuración por defecto insertada');
      }
    } catch (error: any) {
      console.error('⚠️ Error al asegurar tabla configuracion:', error.message);
      // No lanzar error, solo loguear
    }
  }

  // Obtener todas las configuraciones
  static async getAll(): Promise<Configuracion[]> {
    try {
      // Asegurar que la tabla existe antes de hacer queries
      await this.ensureTableAndDefaults();
      
      const result = await pool.query(
        'SELECT * FROM configuracion ORDER BY clave'
      );
      return result.rows;
    } catch (error: any) {
      console.error('❌ Error en getAll configuracion:', error.message);
      // Si hay error, retornar array vacío en lugar de lanzar
      return [];
    }
  }

  // Obtener configuración por clave
  static async getByClave(clave: string): Promise<Configuracion | null> {
    try {
      await this.ensureTableAndDefaults();
      
      const result = await pool.query(
        'SELECT * FROM configuracion WHERE clave = $1',
        [clave]
      );
      return result.rows[0] || null;
    } catch (error: any) {
      console.error('❌ Error en getByClave configuracion:', error.message);
      return null;
    }
  }

  // Obtener configuración como objeto simple
  static async getConfigData(): Promise<{
    nombreSistema: string;
    emailContacto: string;
    tiempoRespuesta: number;
    notificacionesEmail: boolean;
  }> {
    try {
      await this.ensureTableAndDefaults();
      
      const configs = await this.getAll();
      
      // Si no hay configuraciones, retornar valores por defecto
      if (configs.length === 0) {
        console.log('⚠️ No hay configuraciones en la BD, usando valores por defecto');
        return {
          nombreSistema: 'Buzón de Quejas, Sugerencias y Reconocimientos',
          emailContacto: 'quejasysugerenciasfmht@unach.mx',
          tiempoRespuesta: 10,
          notificacionesEmail: true,
        };
      }
      
      const configMap = new Map<string, string>();
      configs.forEach(config => {
        configMap.set(config.clave, config.valor || '');
      });

      return {
        nombreSistema: configMap.get('nombre_sistema') || 'Buzón de Quejas, Sugerencias y Reconocimientos',
        emailContacto: configMap.get('email_contacto') || 'quejasysugerenciasfmht@unach.mx',
        tiempoRespuesta: parseInt(configMap.get('tiempo_respuesta') || '10', 10),
        notificacionesEmail: configMap.get('notificaciones_email') === 'true',
      };
    } catch (error: any) {
      console.error('❌ Error en getConfigData:', error.message);
      // Retornar valores por defecto en caso de error
      return {
        nombreSistema: 'Buzón de Quejas, Sugerencias y Reconocimientos',
        emailContacto: 'quejasysugerenciasfmht@unach.mx',
        tiempoRespuesta: 10,
        notificacionesEmail: true,
      };
    }
  }

  // Actualizar o crear configuración
  static async upsert(config: Configuracion, actualizadoPor?: string): Promise<Configuracion> {
    try {
      await this.ensureTableAndDefaults();
      
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
    } catch (error: any) {
      console.error('❌ Error en upsert configuracion:', error.message);
      throw new Error(`Error al actualizar configuración: ${error.message}`);
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
    try {
      await this.ensureTableAndDefaults();
      
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
    } catch (error: any) {
      console.error('❌ Error en updateConfigData:', error.message);
      throw new Error(`Error al actualizar configuración: ${error.message}`);
    }
  }
}

