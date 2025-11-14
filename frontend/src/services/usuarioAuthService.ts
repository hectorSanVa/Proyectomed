import api from './api';
import { API_BASE_URL } from '../config/api';
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
      const loginUrl = `${API_BASE_URL}/usuarios/login`;
      console.log('📡 Enviando solicitud al servidor...');
      console.log('📡 URL completa:', loginUrl);
      console.log('📡 Correo:', correo);
      console.log('📡 API_BASE_URL:', API_BASE_URL);
      
      try {
        // Verificar primero que el servidor esté disponible (opcional)
        // Si el servidor no responde, el timeout de 30 segundos lo manejará
        
        // Agregar timeout específico para login (30 segundos)
        const startTime = Date.now();
        const response = await api.post('/usuarios/login', { correo }, {
          timeout: 30000,
        });
        const endTime = Date.now();
        console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
        
        console.log('✅ Respuesta del servidor recibida:', response.status);
        console.log('✅ Datos recibidos:', response.data);
        
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
      } catch (apiError: any) {
        console.error('❌ Error en petición al servidor:', {
          message: apiError.message,
          code: apiError.code,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          timeout: apiError.code === 'ECONNABORTED',
        });
        
        // Si es timeout
        if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout')) {
          console.error('⏱️ Timeout: El servidor no respondió en 30 segundos');
          throw new Error('El servidor está tardando mucho en responder. Por favor, intenta nuevamente en unos momentos.');
        }
        
        // Si el endpoint no existe (404), significa que Render aún no desplegó los cambios
        if (apiError.response?.status === 404) {
          console.warn('⚠️ Endpoint /usuarios/login no disponible aún. Render puede estar desplegando...');
          console.warn('⚠️ Usando método temporal (solo correo local)');
          
          // Validar que sea correo institucional de UNACH
          const correoLower = correo.toLowerCase();
          if (!correoLower.includes('@unach.mx') && !correoLower.includes('@unach.edu.mx')) {
            throw new Error('Por favor ingresa tu correo institucional de la UNACH (@unach.mx o @unach.edu.mx)');
          }
          
          // Método temporal: crear sesión local hasta que Render despliegue
          const session: UsuarioSession = {
            id_usuario: null, // Temporal hasta que Render despliegue
            correo: correoLower,
            nombre: correoLower.split('@')[0],
          };

          localStorage.setItem('usuarioSession', JSON.stringify(session));
          console.log('✅ Sesión temporal guardada. El endpoint del servidor estará disponible pronto.');
          
          return {
            success: true,
            session,
            message: 'Sesión iniciada correctamente (modo temporal - el servidor está actualizándose)',
          };
        }
        
        // Si es error 500, puede ser que el servidor esté caído
        if (apiError.response?.status === 500) {
          console.error('❌ Error 500: El servidor tiene un error interno');
          throw new Error('Error en el servidor. Por favor, intenta nuevamente en unos momentos.');
        }
        
        // Para otros errores, lanzar el error original
        throw apiError;
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
