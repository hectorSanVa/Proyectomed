import api from './api';
import { API_ENDPOINTS } from '../config/api';
import type { Estado } from '../types';

export type { Estado };

export const estadoService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.estados);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`${API_ENDPOINTS.estados}/${id}`);
    return response.data;
  },
};

