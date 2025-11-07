import api from './api';
import { API_ENDPOINTS } from '../config/api';
import type { Usuario } from '../types';

export const usuarioService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.usuarios);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`${API_ENDPOINTS.usuarios}/${id}`);
    return response.data;
  },

  create: async (data: Usuario) => {
    const response = await api.post(API_ENDPOINTS.usuarios, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Usuario>) => {
    const response = await api.put(`${API_ENDPOINTS.usuarios}/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`${API_ENDPOINTS.usuarios}/${id}`);
    return response.data;
  },
};

