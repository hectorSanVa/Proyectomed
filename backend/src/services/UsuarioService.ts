import { Usuario } from "../models/Usuario";
import { UsuarioDAO } from "../dao/UsuarioDAO";

export class UsuarioService {
  static async getAll(): Promise<Usuario[]> {
    return await UsuarioDAO.getAll();
  }

  static async getById(id: number): Promise<Usuario | null> {
    return await UsuarioDAO.getById(id);
  }

  static async create(usuario: Omit<Usuario, "id_usuario">): Promise<Usuario> {
    if (!usuario.nombre || !usuario.correo) {
      throw new Error("El nombre y correo son obligatorios");
    }
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
