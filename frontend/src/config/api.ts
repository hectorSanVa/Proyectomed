// Configuración de la API

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  auth: '/auth',
  usuarios: '/usuarios',
  categorias: '/categorias',
  estados: '/estados',
  comunicaciones: '/comunicaciones',
  evidencias: '/evidencias',
  seguimientos: '/seguimientos',
  comisiones: '/comisiones',
  folios: '/folios',
  historialEstados: '/historial-estados',
  reportes: '/reportes/trimestral',
} as const;

