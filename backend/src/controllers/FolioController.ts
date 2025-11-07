import { Request, Response } from "express";
import { FolioService } from "../services/FolioService";

export class FolioController {
  static async getAll(req: Request, res: Response) {
    const folios = await FolioService.getAll();
    res.json(folios);
  }

  static async getByMedioAnio(req: Request, res: Response) {
    const { medio, anio } = req.params;
    const folio = await FolioService.getByMedioAnio(
      medio as "F" | "D",
      Number(anio)
    );
    if (!folio) return res.status(404).json({ message: "Folio no encontrado" });
    res.json(folio);
  }
}
