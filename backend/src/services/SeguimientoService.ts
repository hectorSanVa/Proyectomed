import { Seguimiento } from "../models/Seguimiento";
import { SeguimientoDAO } from "../dao/SeguimientoDAO";

export class SeguimientoService {
  static async getAll(): Promise<Seguimiento[]> {
    return await SeguimientoDAO.getAll();
  }

  static async getById(id: number): Promise<Seguimiento | null> {
    return await SeguimientoDAO.getById(id);
  }

  static async getByComunicacionId(idComunicacion: number): Promise<Seguimiento | null> {
    return await SeguimientoDAO.getByComunicacionId(idComunicacion);
  }

  static async create(
    seguimiento: Omit<Seguimiento, "id_seguimiento" | "fecha_actualizacion">
  ): Promise<Seguimiento> {
    return await SeguimientoDAO.create(seguimiento);
  }

  static async update(
    id: number,
    seguimiento: Partial<Seguimiento>
  ): Promise<Seguimiento | null> {
    return await SeguimientoDAO.update(id, seguimiento);
  }

  static async delete(id: number): Promise<boolean> {
    return await SeguimientoDAO.delete(id);
  }
}
