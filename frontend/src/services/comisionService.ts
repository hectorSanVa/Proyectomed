import api from './api';
import { API_ENDPOINTS } from '../config/api';
import type { Comision } from '../types';

export const comisionService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.comisiones);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`${API_ENDPOINTS.comisiones}/${id}`);
    return response.data;
  },

  create: async (data: Comision) => {
    const response = await api.post(API_ENDPOINTS.comisiones, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Comision>) => {
    const response = await api.put(`${API_ENDPOINTS.comisiones}/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`${API_ENDPOINTS.comisiones}/${id}`);
    return response.data;
  },
};

