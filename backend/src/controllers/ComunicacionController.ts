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

  static async getByFolio(req: Request, res: Response) {
    try {
      // El folio puede venir como query parameter o como path parameter
      // Los folios contienen barras (ej: D0006/11/FMHT/25), por lo que es mejor usar query parameter
      const folio = req.query.folio as string || req.params.folio;
      
      if (!folio) {
        return res.status(400).json({ error: "Folio es requerido" });
      }
      
      const data = await ComunicacionService.getByFolio(folio);
      if (!data)
        return res.status(404).json({ error: "Comunicación no encontrada" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      // El correo puede venir en el body o en los headers (si el usuario está autenticado)
      const correo = req.body.correo || req.headers['x-user-email'] as string;
      const anonimo = req.body.anonimo !== undefined ? req.body.anonimo : (!correo); // Por defecto anónimo si no hay correo
      
      const comunicacionData = {
        ...req.body,
        correo: correo || undefined,
        anonimo: anonimo // Indica si la comunicación debe ser anónima
      };
      
      const data = await ComunicacionService.create(comunicacionData);
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

  static async getReconocimientosPublicos(req: Request, res: Response) {
    try {
      const data = await ComunicacionService.getReconocimientosPublicos();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
