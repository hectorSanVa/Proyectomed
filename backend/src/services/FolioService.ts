import { FolioDAO } from "../dao/FolioDAO";
import { Folio } from "../models/Folio";

export class FolioService {
  static async getAll(): Promise<Folio[]> {
    return await FolioDAO.getAll();
  }

  static async getByMedioAnio(
    medio: "F" | "D",
    anio: number
  ): Promise<Folio | null> {
    return await FolioDAO.getByMedioAnio(medio, anio);
  }
}
