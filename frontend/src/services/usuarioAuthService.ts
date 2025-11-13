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

      // Validar que sea correo institucional de UNACH
      const correoLower = correo.toLowerCase();
      if (!correoLower.includes('@unach.mx') && !correoLower.includes('@unach.edu.mx')) {
        throw new Error('Por favor ingresa tu correo institucional de la UNACH (@unach.mx o @unach.edu.mx)');
      }

      // Sistema completamente anónimo: NO creamos usuarios en la base de datos
      // Solo guardamos la sesión en localStorage para mantener el estado de la aplicación
      // Esto permite que el usuario pueda consultar sus comunicaciones usando su correo,
      // pero sin almacenar información personal en el backend
      console.log('✅ Validación de correo exitosa, creando sesión local (anónima)...');
      
      // Extraer nombre del correo (parte antes del @)
      const nombreUsuario = correoLower.split('@')[0];
      
      // Crear sesión local sin guardar en base de datos
      // id_usuario será null para mantener el anonimato total
      const session: UsuarioSession = {
        id_usuario: null, // No guardamos ID en BD para mantener anonimato
        correo: correoLower,
        nombre: nombreUsuario,
      };

      localStorage.setItem('usuarioSession', JSON.stringify(session));
      console.log('✅ Sesión guardada en localStorage (sistema anónimo - sin registro en BD)');
      
      return {
        success: true,
        session,
        message: 'Sesión iniciada correctamente',
      };
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      // Si el error ya es un string, lanzarlo directamente
      if (typeof error === 'string') {
        throw new Error(error);
      }
      
      // Si es un Error, usar su mensaje
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(error.message || 'Error al iniciar sesión');
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
