import { Request, Response } from "express";
import { HistorialEstadoService } from "../services/HistorialEstadoService";

export class HistorialEstadoController {
  static async getAll(req: Request, res: Response) {
    const historial = await HistorialEstadoService.getAll();
    res.json(historial);
  }

  static async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const historial = await HistorialEstadoService.getById(id);
    if (!historial)
      return res.status(404).json({ message: "Historial no encontrado" });
    res.json(historial);
  }

  static async getByComunicacion(req: Request, res: Response) {
    const idComunicacion = Number(req.params.idComunicacion);
    const historial = await HistorialEstadoService.getByComunicacionId(idComunicacion);
    res.json(historial);
  }

  static async create(req: Request, res: Response) {
    const historial = await HistorialEstadoService.create(req.body);
    res.status(201).json(historial);
  }

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const success = await HistorialEstadoService.delete(id);
    if (!success)
      return res.status(404).json({ message: "Historial no encontrado" });
    res.json({ message: "Historial eliminado" });
  }
}
