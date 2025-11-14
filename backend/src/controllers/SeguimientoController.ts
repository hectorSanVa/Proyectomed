import { Request, Response } from "express";
import { SeguimientoService } from "../services/SeguimientoService";
// --- 1. Importar el modelo AdminRol ---
import { AdminRol } from "../models/UsuarioAdmin"; // (Asegúrate que la ruta a tu modelo sea correcta)

export class SeguimientoController {
  
  // Esta ruta está protegida para 'admin', 'monitor', 'moderador'
  // La lógica para filtrar "solo asignados" (para moderadores) está
  // en el ComunicacionController.getAll, que es la vista principal.
  static async getAll(req: Request, res: Response) {
    try {
      const data = await SeguimientoService.getAll();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Esta ruta está protegida para 'admin', 'monitor', 'moderador'
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

  // ¡ESTA RUTA ES PÚBLICA! No la modificamos.
  // Es usada por la "Consulta de Folio" y "Mis Seguimientos".
  static async getByComunicacion(req: Request, res: Response) {
    try {
      const idComunicacion = Number(req.params.idComunicacion);
      const data = await SeguimientoService.getByComunicacionId(idComunicacion);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Esta ruta está protegida para 'admin' solamente.
  // No se necesita lógica de rol adicional.
  static async create(req: Request, res: Response) {
    try {
      const data = await SeguimientoService.create(req.body);
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * MODIFICADO: Aplica la lógica de permisos para 'admin' vs 'moderador'
   * (La ruta ya bloquea a los 'monitor')
   */
  static async update(req: Request, res: Response) {
    try {
      // --- 2. Leer el payload del usuario ---
      const adminUser = (req as any).user;
      if (!adminUser || !adminUser.rol) {
        return res.status(401).json({ error: "Usuario no autenticado o rol no definido" });
      }

      const rol = adminUser.rol as AdminRol;
      const adminId = adminUser.id as number;
      const id = Number(req.params.id);

      // --- 3. Lógica de Roles (Checklist Paso 3b) ---
      
      if (rol === 'admin') {
        // El ADMIN puede actualizar cualquier campo, incluyendo asignar a un moderador
        // (ej. req.body puede contener { ..., "id_admin_asignado": 5 })
        console.log(`SeguimientoController: Admin ${adminId} actualizando seguimiento ${id}`);
        const data = await SeguimientoService.update(id, req.body);
        if (!data)
          return res.status(404).json({ error: "Seguimiento no encontrado" });
        res.json(data);

      } else if (rol === 'moderador') {
        // El MODERADOR solo puede actualizar 'id_estado' y 'notas' de
        // los seguimientos que tiene asignados.
        console.log(`SeguimientoController: Moderador ${adminId} intentando actualizar seguimiento ${id}`);

        // a. Verificar que el seguimiento le pertenece
        const seguimiento = await SeguimientoService.getById(id);
        if (!seguimiento) {
          return res.status(404).json({ error: "Seguimiento no encontrado" });
        }
        
        if (seguimiento.id_admin_asignado !== adminId) {
          console.warn(`SeguimientoController: Moderador ${adminId} intentó modificar ticket ${id} que no le pertenece (asignado a ${seguimiento.id_admin_asignado}).`);
          return res.status(403).json({ error: "Acceso denegado. No tiene permiso para modificar este seguimiento." });
        }

        // b. Filtrar el body para permitir solo los campos autorizados
        const { id_estado, notas } = req.body;
        const datosParaActualizar = {
          id_estado,
          notas
        };

        const data = await SeguimientoService.update(id, datosParaActualizar);
        res.json(data);
        
      } else {
        // Por si acaso, aunque la ruta ya debería haberlo bloqueado
        return res.status(403).json({ error: "Rol no autorizado para esta acción" });
      }

    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  // Esta ruta está protegida para 'admin' solamente.
  // No se necesita lógica de rol adicional.
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