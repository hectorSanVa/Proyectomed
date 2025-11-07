import { Comunicacion } from "../models/Comunicacion";
import { ComunicacionDAO } from "../dao/ComunicacionDAO";

export class ComunicacionService {
  static async getAll(): Promise<Comunicacion[]> {
    return await ComunicacionDAO.getAll();
  }

  static async getById(id: number): Promise<Comunicacion | null> {
    return await ComunicacionDAO.getById(id);
  }

  static async getByUsuarioId(idUsuario: number): Promise<Comunicacion[]> {
    return await ComunicacionDAO.getByUsuarioId(idUsuario);
  }

  static async create(
    com: Omit<Comunicacion, "id_comunicacion" | "folio" | "fecha_recepcion"> & { medio?: 'F' | 'D' }
  ): Promise<Comunicacion> {
    if (!com.descripcion) {
      throw new Error("La descripción es obligatoria");
    }
    return await ComunicacionDAO.create(com);
  }

  static async update(
    id: number,
    com: Partial<Comunicacion>
  ): Promise<Comunicacion | null> {
    return await ComunicacionDAO.update(id, com);
  }

  static async delete(id: number): Promise<boolean> {
    return await ComunicacionDAO.delete(id);
  }
}
