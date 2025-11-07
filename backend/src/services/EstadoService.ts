import { Estado } from "../models/Estado";
import { EstadoDAO } from "../dao/EstadoDAO";

export class EstadoService {
  static async getAll(): Promise<Estado[]> {
    return await EstadoDAO.getAll();
  }

  static async getById(id: number): Promise<Estado | null> {
    return await EstadoDAO.getById(id);
  }

  static async create(estado: Omit<Estado, "id_estado">): Promise<Estado> {
    if (!estado.nombre_estado) {
      throw new Error("El nombre del estado es obligatorio");
    }
    return await EstadoDAO.create(estado);
  }

  static async update(
    id: number,
    estado: Partial<Estado>
  ): Promise<Estado | null> {
    return await EstadoDAO.update(id, estado);
  }

  static async delete(id: number): Promise<boolean> {
    return await EstadoDAO.delete(id);
  }
}
