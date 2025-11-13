// Configuración de la API

// Cargar URL de la API desde variables de entorno
// En desarrollo local, usar Render si está configurado, sino localhost
// En producción (Vercel), usar la variable de entorno
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV 
  ? 'https://buzon-unach-backend.onrender.com'  // Para desarrollo local con Render
  : 'http://localhost:3000');  // Fallback solo si no hay nada configurado

// Log para debug (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔧 API_BASE_URL configurada:', API_URL);
  console.log('🔧 VITE_API_URL desde env:', import.meta.env.VITE_API_URL);
}

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

