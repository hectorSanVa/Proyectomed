import { Usuario } from "../models/Usuario";
import { UsuarioDAO } from "../dao/UsuarioDAO";

export class UsuarioService {
  static async getAll(): Promise<Usuario[]> {
    return await UsuarioDAO.getAll();
  }

  static async getById(id: number): Promise<Usuario | null> {
    return await UsuarioDAO.getById(id);
  }

  static async getByCorreo(correo: string): Promise<Usuario | null> {
    if (!correo || !correo.includes('@')) {
      throw new Error("Correo electrónico inválido");
    }
    return await UsuarioDAO.getByCorreo(correo);
  }

  /**
   * Crear o obtener usuario por correo para seguimiento de comunicaciones
   * Crea un usuario mínimo con solo el correo si no existe
   */
  static async createOrGetByCorreo(correo: string): Promise<Usuario> {
    if (!correo || !correo.includes('@')) {
      throw new Error("Correo electrónico inválido");
    }
    return await UsuarioDAO.createOrGetByCorreo(correo);
  }

  static async create(usuario: Omit<Usuario, "id_usuario">): Promise<Usuario> {
    if (!usuario.correo) {
      throw new Error("El correo es obligatorio");
    }
    // El nombre puede ser opcional, se genera automáticamente si no se proporciona
    return await UsuarioDAO.create(usuario);
  }

  static async update(
    id: number,
    usuario: Partial<Usuario>
  ): Promise<Usuario | null> {
    const existente = await UsuarioDAO.getById(id);
    if (!existente) {
      throw new Error("Usuario no encontrado");
    }
    return await UsuarioDAO.update(id, usuario);
  }

  static async delete(id: number): Promise<boolean> {
    return await UsuarioDAO.delete(id);
  }
}
