import { Categoria } from "../models/Categoria";
import { CategoriaDAO } from "../dao/CategoriaDAO";

export class CategoriaService {
  static async getAll(): Promise<Categoria[]> {
    return await CategoriaDAO.getAll();
  }

  static async getById(id: number): Promise<Categoria | null> {
    return await CategoriaDAO.getById(id);
  }

  static async create(
    categoria: Omit<Categoria, "id_categoria">
  ): Promise<Categoria> {
    if (!categoria.nombre_categoria) {
      throw new Error("El nombre de la categoría es obligatorio");
    }
    return await CategoriaDAO.create(categoria);
  }

  static async update(
    id: number,
    categoria: Partial<Categoria>
  ): Promise<Categoria | null> {
    return await CategoriaDAO.update(id, categoria);
  }

  static async delete(id: number): Promise<boolean> {
    return await CategoriaDAO.delete(id);
  }
}
