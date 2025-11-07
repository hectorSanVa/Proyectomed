import { Request, Response } from "express";
import { SeguimientoService } from "../services/SeguimientoService";

export class SeguimientoController {
  static async getAll(req: Request, res: Response) {
    try {
      const data = await SeguimientoService.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await SeguimientoService.getById(id);
      if (!data)
        return res.status(404).json({ error: "Seguimiento no encontrado" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getByComunicacion(req: Request, res: Response) {
    try {
      const idComunicacion = Number(req.params.idComunicacion);
      const data = await SeguimientoService.getByComunicacionId(idComunicacion);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = await SeguimientoService.create(req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await SeguimientoService.update(id, req.body);
      if (!data)
        return res.status(404).json({ error: "Seguimiento no encontrado" });
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await SeguimientoService.delete(id);
      if (!deleted)
        return res.status(404).json({ error: "Seguimiento no encontrado" });
      res.json({ message: "Seguimiento eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
