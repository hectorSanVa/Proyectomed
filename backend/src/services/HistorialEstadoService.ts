import { HistorialEstadoDAO } from "../dao/HistorialEstadoDAO";
import { HistorialEstado } from "../models/HistorialEstado";

export class HistorialEstadoService {
  static async getAll(): Promise<HistorialEstado[]> {
    return await HistorialEstadoDAO.getAll();
  }

  static async getById(id: number): Promise<HistorialEstado | null> {
    return await HistorialEstadoDAO.getById(id);
  }

  static async getByComunicacionId(idComunicacion: number): Promise<HistorialEstado[]> {
    return await HistorialEstadoDAO.getByComunicacionId(idComunicacion);
  }

  static async create(
    historial: Omit<HistorialEstado, "id_historial" | "fecha_actualizacion">
  ): Promise<HistorialEstado> {
    return await HistorialEstadoDAO.create(historial);
  }

  static async delete(id: number): Promise<boolean> {
    return await HistorialEstadoDAO.delete(id);
  }
}
