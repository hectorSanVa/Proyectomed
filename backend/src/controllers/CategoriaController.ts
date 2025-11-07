import { Request, Response } from "express";
import { CategoriaService } from "../services/CategoriaService";

export class CategoriaController {
  static async getAll(req: Request, res: Response) {
    try {
      const categorias = await CategoriaService.getAll();
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const categoria = await CategoriaService.getById(id);
      if (!categoria)
        return res.status(404).json({ error: "Categoría no encontrada" });
      res.json(categoria);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const categoria = await CategoriaService.create(req.body);
      res.status(201).json(categoria);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const categoria = await CategoriaService.update(id, req.body);
      if (!categoria)
        return res.status(404).json({ error: "Categoría no encontrada" });
      res.json(categoria);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await CategoriaService.delete(id);
      if (!deleted)
        return res.status(404).json({ error: "Categoría no encontrada" });
      res.json({ message: "Categoría eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
