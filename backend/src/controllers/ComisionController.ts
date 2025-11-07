import { Request, Response } from "express";
import { ComisionService } from "../services/ComisionService";

export class ComisionController {
  static async getAll(req: Request, res: Response) {
    try {
      const data = await ComisionService.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await ComisionService.getById(id);
      if (!data)
        return res.status(404).json({ error: "Comisión no encontrada" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = await ComisionService.create(req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await ComisionService.update(id, req.body);
      if (!data)
        return res.status(404).json({ error: "Comisión no encontrada" });
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await ComisionService.delete(id);
      if (!deleted)
        return res.status(404).json({ error: "Comisión no encontrada" });
      res.json({ message: "Comisión eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
