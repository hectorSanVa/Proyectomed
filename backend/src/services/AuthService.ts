// Servicio simple de autenticación
// En producción, esto debería usar JWT y hash de contraseñas

export interface AdminUser {
  id: number;
  username: string;
  password: string; // En producción esto debería estar hasheado
  nombre: string;
  rol: string;
}

// Usuarios administradores (en producción esto debería estar en la BD)
const ADMIN_USERS: AdminUser[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123', // Contraseña por defecto - CAMBIAR EN PRODUCCIÓN
    nombre: 'Administrador',
    rol: 'admin'
  },
  {
    id: 2,
    username: 'secretario',
    password: 'secretario123', // Contraseña por defecto - CAMBIAR EN PRODUCCIÓN
    nombre: 'Secretario Técnico',
    rol: 'secretario'
  }
];

export class AuthService {
  static async login(username: string, password: string): Promise<AdminUser | null> {
    const user = ADMIN_USERS.find(
      u => u.username === username && u.password === password
    );
    
    if (!user) {
      return null;
    }

    // Retornar usuario sin la contraseña
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as AdminUser;
  }

  static async getUserByUsername(username: string): Promise<AdminUser | null> {
    const user = ADMIN_USERS.find(u => u.username === username);
    if (!user) return null;
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as AdminUser;
  }
}



