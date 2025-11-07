import { EvidenciaDAO } from "../dao/EvidenciaDAO";
import { Evidencia } from "../models/Evidencia";

export class EvidenciaService {
  static async getAll(): Promise<Evidencia[]> {
    return await EvidenciaDAO.getAll();
  }

  static async getById(id: number): Promise<Evidencia | null> {
    return await EvidenciaDAO.getById(id);
  }

  static async create(evidencia: Omit<Evidencia, "id_evidencia" | "fecha_subida">): Promise<Evidencia> {
    return await EvidenciaDAO.create(evidencia);
  }

  static async update(id: number, evidencia: Partial<Evidencia>): Promise<Evidencia | null> {
    return await EvidenciaDAO.update(id, evidencia);
  }

  static async delete(id: number): Promise<boolean> {
    return await EvidenciaDAO.delete(id);
  }

  static async getByComunicacionId(idComunicacion: number): Promise<Evidencia[]> {
    return await EvidenciaDAO.getByComunicacionId(idComunicacion);
  }
}
