import api from './api';
import type { UsuarioSession } from '../types';

export interface UsuarioLoginResponse {
  success: boolean;
  session: UsuarioSession;
  message: string;
}

export const usuarioAuthService = {
  login: async (correo: string): Promise<UsuarioLoginResponse> => {
    try {
      console.log('🔐 Intentando iniciar sesión con correo:', correo);
      
      // Validar formato de correo
      if (!correo || !correo.includes('@')) {
        throw new Error('Por favor ingresa un correo electrónico válido');
      }

      // Llamar al backend para crear o obtener usuario
      console.log('📡 Enviando solicitud al servidor...');
      const response = await api.post('/usuarios/login', { correo });
      
      if (response.data.success) {
        const session = response.data.session;
        
        // Guardar sesión en localStorage para persistencia local
        localStorage.setItem('usuarioSession', JSON.stringify(session));
        console.log('✅ Sesión guardada en servidor y localStorage. Usuario ID:', session.id_usuario);
        
        return {
          success: true,
          session,
          message: response.data.message || 'Sesión iniciada correctamente',
        };
      } else {
        throw new Error(response.data.error || 'Error al iniciar sesión');
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      // Si es un error de axios, extraer el mensaje del servidor
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      // Si es un Error, usar su mensaje
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(error.message || 'Error al iniciar sesión. Verifica tu conexión.');
    }
  },

  logout: () => {
    localStorage.removeItem('usuarioSession');
  },

  getCurrentSession: (): UsuarioSession | null => {
    const sessionStr = localStorage.getItem('usuarioSession');
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('usuarioSession');
  },
};
