import api from './api';
import { API_ENDPOINTS } from '../config/api';
import type { HistorialEstado } from '../types';

export const historialEstadoService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.historialEstados);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`${API_ENDPOINTS.historialEstados}/${id}`);
    return response.data;
  },

  getByComunicacionId: async (idComunicacion: number) => {
    const response = await api.get(`${API_ENDPOINTS.historialEstados}/comunicacion/${idComunicacion}`);
    return response.data;
  },

  create: async (data: Omit<HistorialEstado, 'id_historial' | 'fecha_actualizacion'>) => {
    const response = await api.post(API_ENDPOINTS.historialEstados, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`${API_ENDPOINTS.historialEstados}/${id}`);
    return response.data;
  },
};


