import { ConfiguracionDAO } from '../dao/ConfiguracionDAO';
import { ConfigData } from '../models/Configuracion';

export class ConfiguracionService {
  // Obtener todas las configuraciones
  static async getAll() {
    return await ConfiguracionDAO.getAll();
  }

  // Obtener configuración por clave
  static async getByClave(clave: string) {
    return await ConfiguracionDAO.getByClave(clave);
  }

  // Obtener configuración como objeto simple
  static async getConfigData(): Promise<ConfigData> {
    return await ConfiguracionDAO.getConfigData();
  }

  // Actualizar configuración
  static async updateConfigData(data: ConfigData, actualizadoPor?: string) {
    // Validaciones
    if (!data.nombreSistema || !data.nombreSistema.trim()) {
      throw new Error('El nombre del sistema es requerido');
    }
    if (!data.emailContacto || !data.emailContacto.includes('@')) {
      throw new Error('El email de contacto debe ser válido');
    }
    if (data.tiempoRespuesta < 1 || data.tiempoRespuesta > 365) {
      throw new Error('El tiempo de respuesta debe estar entre 1 y 365 días');
    }

    await ConfiguracionDAO.updateConfigData(data, actualizadoPor);
    return await ConfiguracionDAO.getConfigData();
  }
}

