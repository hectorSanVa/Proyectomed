import { Request, Response } from "express";
import { UsuarioService } from "../services/UsuarioService";

export class UsuarioController {
  static async getAll(req: Request, res: Response) {
    try {
      const usuarios = await UsuarioService.getAll();
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const usuario = await UsuarioService.getById(id);
      if (!usuario)
        return res.status(404).json({ error: "Usuario no encontrado" });
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  static async getByCorreo(req: Request, res: Response) {
    try {
      const correo = decodeURIComponent(req.params.correo);
      const usuario = await UsuarioService.getByCorreo(correo);
      if (!usuario)
        return res.status(404).json({ error: "Usuario no encontrado" });
      res.json(usuario);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const usuario = await UsuarioService.create(req.body);
      res.status(201).json(usuario);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const usuario = await UsuarioService.update(id, req.body);
      if (!usuario)
        return res.status(404).json({ error: "Usuario no encontrado" });
      res.json(usuario);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await UsuarioService.delete(id);
      if (!deleted)
        return res.status(404).json({ error: "Usuario no encontrado" });
      res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Login de usuario: crear o obtener usuario por correo
  static async login(req: Request, res: Response) {
    try {
      const { correo } = req.body;

      if (!correo || !correo.includes('@')) {
        return res.status(400).json({ error: "Correo electrónico inválido" });
      }

      // Validar que sea correo institucional de UNACH
      const correoLower = correo.toLowerCase();
      if (!correoLower.includes('@unach.mx') && !correoLower.includes('@unach.edu.mx')) {
        return res.status(400).json({ error: "Por favor ingresa tu correo institucional de la UNACH (@unach.mx o @unach.edu.mx)" });
      }

      // Crear o obtener usuario por correo (se guarda en la base de datos)
      const usuario = await UsuarioService.createOrGetByCorreo(correoLower);

      // Retornar sesión con información del usuario
      res.json({
        success: true,
        session: {
          id_usuario: usuario.id_usuario,
          correo: usuario.correo,
          nombre: usuario.nombre || correoLower.split('@')[0],
        },
        message: "Sesión iniciada correctamente",
      });
    } catch (error: any) {
      console.error('Error en login de usuario:', error);
      res.status(500).json({ error: error.message || "Error al iniciar sesión" });
    }
  }
}
