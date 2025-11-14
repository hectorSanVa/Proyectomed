import api from './api';
import { API_ENDPOINTS } from '../config/api';

export const categoriaService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.categorias);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`${API_ENDPOINTS.categorias}/${id}`);
    return response.data;
  },
};

