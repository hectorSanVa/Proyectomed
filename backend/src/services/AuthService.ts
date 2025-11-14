// Importa el nuevo servicio de admin y el modelo
import { UsuarioAdminService } from "./UsuarioAdminService";
import { UsuarioAdmin } from "../models/UsuarioAdmin";
// Importa bcryptjs para comparar contraseñas
import bcrypt from "bcryptjs";

export class AuthService {

  /**
   * Modificado para consultar la base de datos y comparar contraseñas hasheadas
   */
  static async login(username: string, password: string): Promise<Omit<UsuarioAdmin, 'password'> | null> {
    
    // 1. Buscar al usuario en la base de datos (esto trae la contraseña hasheada)
    const user = await UsuarioAdminService.getByUsername(username);

    // Si el usuario no existe, las credenciales son inválidas
    if (!user) {
      console.log(`AuthService: Usuario no encontrado: ${username}`);
      return null;
    }

    // 2. Comparar la contraseña proporcionada con la contraseña hasheada de la BD
    const isMatch = await bcrypt.compare(password, user.password);

    // Si las contraseñas no coinciden, credenciales inválidas
    if (!isMatch) {
      console.log(`AuthService: Contraseña incorrecta para: ${username}`);
      return null;
    }

    // 3. Login exitoso. Devolver el usuario sin la contraseña hasheada.
    console.log(`AuthService: Login exitoso para: ${username}, Rol: ${user.rol}`);
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Modificado para usar el nuevo servicio de base de datos
   */
  static async getUserByUsername(username: string): Promise<Omit<UsuarioAdmin, 'password'> | null> {
    
    const user = await UsuarioAdminService.getByUsername(username);
    
    if (!user) return null;
    
    // Retornar usuario sin la contraseña
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}