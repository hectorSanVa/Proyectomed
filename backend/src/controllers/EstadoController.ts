import { Request, Response } from "express";
import { EstadoService } from "../services/EstadoService";

export class EstadoController {
  static async getAll(req: Request, res: Response) {
    try {
      const estados = await EstadoService.getAll();
      res.json(estados);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const estado = await EstadoService.getById(id);
      if (!estado)
        return res.status(404).json({ error: "Estado no encontrado" });
      res.json(estado);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const estado = await EstadoService.create(req.body);
      res.status(201).json(estado);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const estado = await EstadoService.update(id, req.body);
      if (!estado)
        return res.status(404).json({ error: "Estado no encontrado" });
      res.json(estado);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await EstadoService.delete(id);
      if (!deleted)
        return res.status(404).json({ error: "Estado no encontrado" });
      res.json({ message: "Estado eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
