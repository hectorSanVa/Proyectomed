import { UsuarioAdminDAO, UsuarioAdminSinPassword } from "../dao/UsuarioAdminDAO";
import { UsuarioAdmin, AdminRol } from "../models/UsuarioAdmin";
import bcrypt from "bcryptjs";

const saltRounds = 10; // Costo del hasheo

export class UsuarioAdminService {

  /**
   * Obtiene todos los usuarios (sin password)
   */
  static async getAll(): Promise<UsuarioAdminSinPassword[]> {
    return await UsuarioAdminDAO.getAll();
  }

  /**
   * Obtiene un usuario por ID (sin password)
   */
  static async getById(id: number): Promise<UsuarioAdminSinPassword | null> {
    return await UsuarioAdminDAO.getById(id);
  }

  /**
   * Obtiene un usuario por username (CON password hasheada)
   * ¡Usar solo para autenticación interna!
   */
  static async getByUsername(username: string): Promise<UsuarioAdmin | null> {
    return await UsuarioAdminDAO.getByUsername(username);
  }

  /**
   * Crea un nuevo usuario y hashea su contraseña
   */
  static async create(data: Omit<UsuarioAdmin, 'id_admin'>): Promise<UsuarioAdminSinPassword> {
    if (!data.username || !data.password || !data.rol) {
      throw new Error("Username, password y rol son requeridos");
    }
    
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    
    const usuarioAdmin: UsuarioAdmin = {
      ...data,
      password: hashedPassword
    };
    
    const newUser = await UsuarioAdminDAO.create(usuarioAdmin);
    
    // Devolver el usuario sin la contraseña
    const { password, ...userSinPassword } = newUser;
    return userSinPassword;
  }

  /**
   * Actualiza un usuario. Si se incluye una nueva contraseña, la hashea.
   */
  static async update(id: number, data: Partial<Omit<UsuarioAdmin, 'id_admin'>>): Promise<UsuarioAdminSinPassword | null> {
    const dataParaDAO: Partial<UsuarioAdmin> = { ...data };
    
    // Si se está actualizando la contraseña, hashearla
    if (data.password) {
      dataParaDAO.password = await bcrypt.hash(data.password, saltRounds);
    }
    
    return await UsuarioAdminDAO.update(id, dataParaDAO);
  }

  /**
   * Elimina un usuario
   */
  static async delete(id: number): Promise<boolean> {
    return await UsuarioAdminDAO.delete(id);
  }
}