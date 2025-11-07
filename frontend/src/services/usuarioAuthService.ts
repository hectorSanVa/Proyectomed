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

      // Validar que sea correo institucional de UNACH
      const correoLower = correo.toLowerCase();
      if (!correoLower.includes('@unach.mx') && !correoLower.includes('@unach.edu.mx')) {
        throw new Error('Por favor ingresa tu correo institucional de la UNACH (@unach.mx o @unach.edu.mx)');
      }

      // Buscar usuario por correo en el backend
      console.log('📡 Consultando usuarios en el backend...');
      const response = await api.get('/usuarios');
      
      if (!response.data) {
        throw new Error('No se pudo obtener la lista de usuarios');
      }

      const usuarios = Array.isArray(response.data) ? response.data : [];
      console.log(`✅ Se encontraron ${usuarios.length} usuarios`);
      
      const usuario = usuarios.find((u: any) => u.correo && u.correo.toLowerCase() === correo.toLowerCase());

      if (!usuario) {
        console.log('👤 Usuario no existe, creando nuevo usuario...');
        // Si no existe, crear uno nuevo con datos mínimos
        const newUsuario = await api.post('/usuarios', {
          nombre: correo.split('@')[0], // Nombre por defecto del correo
          correo: correo,
          telefono: '',
          semestre_area: '',
          tipo_usuario: 'Estudiante',
          sexo: 'Prefiero no responder',
          confidencial: false,
          autorizo_contacto: false,
        });

        if (!newUsuario.data || !newUsuario.data.id_usuario) {
          throw new Error('Error al crear el usuario');
        }

        const session: UsuarioSession = {
          id_usuario: newUsuario.data.id_usuario,
          correo: newUsuario.data.correo,
          nombre: newUsuario.data.nombre || undefined,
        };

        localStorage.setItem('usuarioSession', JSON.stringify(session));
        console.log('✅ Usuario creado y sesión iniciada');
        return {
          success: true,
          session,
          message: 'Sesión iniciada correctamente',
        };
      }

      console.log('✅ Usuario encontrado, iniciando sesión...');
      // Si existe, crear sesión
      const session: UsuarioSession = {
        id_usuario: usuario.id_usuario,
        correo: usuario.correo,
        nombre: usuario.nombre || undefined,
      };

      localStorage.setItem('usuarioSession', JSON.stringify(session));
      console.log('✅ Sesión guardada en localStorage');
      return {
        success: true,
        session,
        message: 'Sesión iniciada correctamente',
      };
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      // Mensajes de error más específicos
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:3000');
      }
      
      if (error.response?.status === 404) {
        throw new Error('El endpoint de usuarios no está disponible');
      }
      
      if (error.response?.status >= 500) {
        throw new Error('Error en el servidor. Por favor intenta más tarde');
      }
      
      throw new Error(error.response?.data?.error || error.message || 'Error al iniciar sesión');
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
