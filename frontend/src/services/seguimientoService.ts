import api from './api';
import { API_ENDPOINTS } from '../config/api';
import type { Seguimiento } from '../types';

export const seguimientoService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.seguimientos);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`${API_ENDPOINTS.seguimientos}/${id}`);
    return response.data;
  },

  getByComunicacionId: async (idComunicacion: number) => {
    const response = await api.get(`${API_ENDPOINTS.seguimientos}/comunicacion/${idComunicacion}`);
    return response.data;
  },

  create: async (data: Seguimiento) => {
    const response = await api.post(API_ENDPOINTS.seguimientos, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Seguimiento>) => {
    const response = await api.put(`${API_ENDPOINTS.seguimientos}/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`${API_ENDPOINTS.seguimientos}/${id}`);
    return response.data;
  },
};

