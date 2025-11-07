import api from './api';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import type { Evidencia } from '../types';

export const evidenciaService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.evidencias);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`${API_ENDPOINTS.evidencias}/${id}`);
    return response.data;
  },

  getByComunicacionId: async (idComunicacion: number) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.evidencias}/comunicacion/${idComunicacion}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener evidencias:', error);
      return [];
    }
  },

  upload: async (idComunicacion: number, file: File) => {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('id_comunicacion', idComunicacion.toString());
    
    // axios automáticamente detecta FormData y configura el Content-Type correctamente
    const response = await api.post(API_ENDPOINTS.evidencias, formData);
    return response.data;
  },

  create: async (data: Evidencia) => {
    const response = await api.post(API_ENDPOINTS.evidencias, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Evidencia>) => {
    const response = await api.put(`${API_ENDPOINTS.evidencias}/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`${API_ENDPOINTS.evidencias}/${id}`);
    return response.data;
  },
};

