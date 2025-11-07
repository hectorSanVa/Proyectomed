import { Request, Response } from "express";
import { ComunicacionService } from "../services/ComunicacionService";

export class ComunicacionController {
  static async getAll(req: Request, res: Response) {
    try {
      const data = await ComunicacionService.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await ComunicacionService.getById(id);
      if (!data)
        return res.status(404).json({ error: "Comunicación no encontrada" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getByUsuario(req: Request, res: Response) {
    try {
      const idUsuario = Number(req.params.idUsuario);
      const data = await ComunicacionService.getByUsuarioId(idUsuario);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = await ComunicacionService.create(req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await ComunicacionService.update(id, req.body);
      if (!data)
        return res.status(404).json({ error: "Comunicación no encontrada" });
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await ComunicacionService.delete(id);
      if (!deleted)
        return res.status(404).json({ error: "Comunicación no encontrada" });
      res.json({ message: "Comunicación eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
