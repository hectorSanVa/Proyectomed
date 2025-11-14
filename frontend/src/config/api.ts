// Configuración de la API
// TODO debe estar en producción - no usar localhost

// Cargar URL de la API desde variables de entorno
// En producción (Vercel), usar la variable de entorno VITE_API_URL
// Si no está configurada, usar el backend de Render
const API_URL = import.meta.env.VITE_API_URL || 'https://buzon-unach-backend.onrender.com';

// Log para debug
console.log('🔧 API_BASE_URL configurada:', API_URL);
console.log('🔧 VITE_API_URL desde env:', import.meta.env.VITE_API_URL);
console.log('🔧 Modo:', import.meta.env.MODE);

export const API_BASE_URL = API_URL;

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

