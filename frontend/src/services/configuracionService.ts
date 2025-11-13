import api from './api';
import type { ConfigData } from '../types';

export const configuracionService = {
  // Obtener configuración
  getConfigData: async (): Promise<ConfigData> => {
    const response = await api.get('/configuracion/data');
    return response.data;
  },

  // Actualizar configuración
  updateConfigData: async (data: ConfigData): Promise<ConfigData> => {
    const response = await api.put('/configuracion/data', data);
    return response.data;
  },
};

