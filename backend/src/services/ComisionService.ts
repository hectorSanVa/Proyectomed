import { Comision } from "../models/Comision";
import { ComisionDAO } from "../dao/ComisionDAO";

export class ComisionService {
  static async getAll(): Promise<Comision[]> {
    return await ComisionDAO.getAll();
  }

  static async getById(id: number): Promise<Comision | null> {
    return await ComisionDAO.getById(id);
  }

  static async create(com: Omit<Comision, "id_miembro">): Promise<Comision> {
    if (!com.nombre || !com.rol) {
      throw new Error("El nombre y rol son obligatorios");
    }
    return await ComisionDAO.create(com);
  }

  static async update(
    id: number,
    com: Partial<Comision>
  ): Promise<Comision | null> {
    return await ComisionDAO.update(id, com);
  }

  static async delete(id: number): Promise<boolean> {
    return await ComisionDAO.delete(id);
  }
}
