import api from './api';
import { API_ENDPOINTS } from '../config/api';
import type { Comunicacion, ComunicacionCreate } from '../types';

export const comunicacionService = {
  // Obtener todas las comunicaciones
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.comunicaciones);
    return response.data;
  },

  // Obtener comunicación por ID
  getById: async (id: number) => {
    const response = await api.get(`${API_ENDPOINTS.comunicaciones}/${id}`);
    return response.data;
  },

  // Crear nueva comunicación
  create: async (data: ComunicacionCreate) => {
    const response = await api.post(API_ENDPOINTS.comunicaciones, {
      ...data,
      medio: data.medio || 'D', // Por defecto Digital si no se especifica
    });
    return response.data;
  },

  // Actualizar comunicación
  update: async (id: number, data: Partial<Comunicacion>) => {
    const response = await api.put(`${API_ENDPOINTS.comunicaciones}/${id}`, data);
    return response.data;
  },

  // Eliminar comunicación
  delete: async (id: number) => {
    const response = await api.delete(`${API_ENDPOINTS.comunicaciones}/${id}`);
    return response.data;
  },

  // Buscar por folio (usando query parameter para manejar folios con barras)
  getByFolio: async (folio: string) => {
    // Codificar el folio para URL (las barras se convierten en %2F)
    const folioEncoded = encodeURIComponent(folio);
    const response = await api.get(`${API_ENDPOINTS.comunicaciones}/folio?folio=${folioEncoded}`);
    return response.data;
  },

  // Obtener comunicaciones por usuario
  getByUsuarioId: async (idUsuario: number) => {
    const response = await api.get(`${API_ENDPOINTS.comunicaciones}/usuario/${idUsuario}`);
    return response.data;
  },

  // Obtener reconocimientos públicos
  getReconocimientosPublicos: async () => {
    const response = await api.get(`${API_ENDPOINTS.comunicaciones}/reconocimientos/publicos`);
    return response.data;
  },
};

