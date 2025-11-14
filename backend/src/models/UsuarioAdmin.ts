// Define los roles permitidos según tu checklist
export type AdminRol = 'admin' | 'monitor' | 'moderador';

export interface UsuarioAdmin {
  id_admin?: number;
  username: string;
  password: string; // Esta será la contraseña hasheada
  nombre: string;
  rol: AdminRol;
}