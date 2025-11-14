import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const folioService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.folios);
    return response.data;
  },

  getByMedioAnio: async (medio: 'F' | 'D', anio: number) => {
    const response = await api.get(`${API_ENDPOINTS.folios}/${medio}/${anio}`);
    return response.data;
  },
};

