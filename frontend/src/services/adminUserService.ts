import api from './api';
// Importamos los tipos que definimos en types/index.ts
import type { User, AdminRol } from '../types';

// --- Definimos los tipos para los payloads (datos que se envían) ---

// Datos para crear un nuevo usuario. Omitimos 'id'
export type CreateAdminUserData = Omit<User, 'id'> & { password?: string };

// Datos para actualizar. Todos los campos son opcionales
export type UpdateAdminUserData = Partial<CreateAdminUserData>;

// --- Definimos el servicio ---

// Tipo que devuelve el backend (con id_admin)
interface UsuarioAdminResponse {
  id_admin: number;
  username: string;
  nombre: string;
  rol: AdminRol;
}

export const adminUserService = {
  
  /**
   * Obtiene todos los usuarios administradores
   * Llama a: GET /api/admin/users
   * Mapea id_admin del backend a id del frontend
   */
  async getAdminUsers(): Promise<User[]> {
    try {
      const response = await api.get<UsuarioAdminResponse[]>('/api/admin/users');
      // Mapear id_admin -> id para el frontend
      return response.data.map(user => ({
        id: user.id_admin,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol
      }));
    } catch (error) {
      console.error('Error al obtener usuarios admin:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo usuario administrador
   * Llama a: POST /api/admin/users
   * Mapea id_admin del backend a id del frontend
   */
  async createAdminUser(userData: CreateAdminUserData): Promise<User> {
    try {
      const response = await api.post<UsuarioAdminResponse>('/api/admin/users', userData);
      // Mapear id_admin -> id para el frontend
      return {
        id: response.data.id_admin,
        username: response.data.username,
        nombre: response.data.nombre,
        rol: response.data.rol
      };
    } catch (error) {
      console.error('Error al crear usuario admin:', error);
      throw error;
    }
  },

  /**
   * Actualiza un usuario administrador
   * Llama a: PUT /api/admin/users/:id
   * Mapea id_admin del backend a id del frontend
   */
  async updateAdminUser(id: number, userData: UpdateAdminUserData): Promise<User> {
    try {
      const response = await api.put<UsuarioAdminResponse>(`/api/admin/users/${id}`, userData);
      // Mapear id_admin -> id para el frontend
      return {
        id: response.data.id_admin,
        username: response.data.username,
        nombre: response.data.nombre,
        rol: response.data.rol
      };
    } catch (error) {
      console.error('Error al actualizar usuario admin:', error);
      throw error;
    }
  },

  /**
   * Elimina un usuario administrador
   * Llama a: DELETE /api/admin/users/:id
   */
  async deleteAdminUser(id: number): Promise<void> {
    try {
      await api.delete(`/api/admin/users/${id}`);
    } catch (error) {
      console.error('Error al eliminar usuario admin:', error);
      throw error;
    }
  }
};