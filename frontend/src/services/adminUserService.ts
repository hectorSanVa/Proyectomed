import api from './api';
// Importamos los tipos que definimos en types/index.ts
import type { User, AdminRol } from '../types';

// --- Definimos los tipos para los payloads (datos que se envían) ---

// Datos para crear un nuevo usuario. Omitimos 'id'
export type CreateAdminUserData = Omit<User, 'id'> & { password?: string };

// Datos para actualizar. Todos los campos son opcionales
export type UpdateAdminUserData = Partial<CreateAdminUserData>;

// --- Definimos el servicio ---

export const adminUserService = {
  
  /**
   * Obtiene todos los usuarios administradores
   * Llama a: GET /api/admin/users
   */
  async getAdminUsers(): Promise<User[]> {
    try {
      const response = await api.get<User[]>('/api/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios admin:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo usuario administrador
   * Llama a: POST /api/admin/users
   */
  async createAdminUser(userData: CreateAdminUserData): Promise<User> {
    try {
      const response = await api.post<User>('/api/admin/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario admin:', error);
      throw error;
    }
  },

  /**
   * Actualiza un usuario administrador
   * Llama a: PUT /api/admin/users/:id
   */
  async updateAdminUser(id: number, userData: UpdateAdminUserData): Promise<User> {
    try {
      const response = await api.put<User>(`/api/admin/users/${id}`, userData);
      return response.data;
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