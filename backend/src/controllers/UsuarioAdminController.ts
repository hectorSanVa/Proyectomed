import { Request, Response } from "express";
import { UsuarioAdminService } from "../services/UsuarioAdminService";
import { AdminRol } from "../models/UsuarioAdmin";

export class UsuarioAdminController {

  // GET /api/admin/users
  static async getAll(req: Request, res: Response) {
    try {
      const usuarios = await UsuarioAdminService.getAll();
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // GET /api/admin/users/:id
  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const usuario = await UsuarioAdminService.getById(id);
      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // POST /api/admin/users
  static async create(req: Request, res: Response) {
    try {
      const { username, password, nombre, rol } = req.body;
      
      // Validar que el rol sea uno de los permitidos
      const rolesPermitidos: AdminRol[] = ['admin', 'monitor', 'moderador'];
      if (!rolesPermitidos.includes(rol)) {
        return res.status(400).json({ error: `Rol inválido. Debe ser 'admin', 'monitor' o 'moderador'.` });
      }

      const nuevoUsuario = await UsuarioAdminService.create({
        username,
        password,
        nombre,
        rol
      });
      // Se devuelve el usuario sin la contraseña (manejado por el service)
      res.status(201).json(nuevoUsuario);
    } catch (error) {
      // Manejar error de username duplicado
      if ((error as any).code === '23505') { // Código de PostgreSQL para unique violation
        return res.status(400).json({ error: "El nombre de usuario ya existe" });
      }
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // PUT /api/admin/users/:id
  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { nombre, rol, password } = req.body;
      
      const datosActualizar: any = { nombre, rol };

      // Si se envió una nueva contraseña, se incluye para hashear
      if (password) {
        datosActualizar.password = password;
      }
      
      // Validar el rol si se está actualizando
      if (rol) {
        const rolesPermitidos: AdminRol[] = ['admin', 'monitor', 'moderador'];
        if (!rolesPermitidos.includes(rol)) {
          return res.status(400).json({ error: `Rol inválido. Debe ser 'admin', 'monitor' o 'moderador'.` });
        }
      }

      const usuario = await UsuarioAdminService.update(id, datosActualizar);
      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      res.json(usuario);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // DELETE /api/admin/users/:id
  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      
      // Lógica de seguridad: No permitir que un admin se elimine a sí mismo
      const adminQueElimina = (req as any).user;
      if (adminQueElimina.id === id) {
          return res.status(400).json({ error: "No puedes eliminar tu propia cuenta de administrador." });
      }

      const deleted = await UsuarioAdminService.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}