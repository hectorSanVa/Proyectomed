import { Request, Response } from "express";
import { ComunicacionService } from "../services/ComunicacionService";
// --- 1. Importar el modelo AdminRol ---
import { AdminRol } from "../models/UsuarioAdmin"; // (Asegúrate que la ruta a tu modelo sea correcta)

export class ComunicacionController {
  
  /**
   * MODIFICADO: Ahora filtra la lista según el rol del admin logueado
   */
  static async getAll(req: Request, res: Response) {
    try {
      // --- 2. Leer el payload del usuario adjuntado por el middleware ---
      const adminUser = (req as any).user;

      if (!adminUser || !adminUser.rol) {
        // Esto es una salvaguarda, el middleware ya debería haberlo bloqueado
        return res.status(401).json({ error: "Usuario no autenticado o rol no definido" });
      }

      const rol = adminUser.rol as AdminRol;
      const adminId = adminUser.id as number;

      // --- 3. Lógica de Roles (Checklist Paso 3a) ---
      if (rol === 'admin' || rol === 'monitor') {
        // Rol 'admin' o 'monitor': Devuelve todas las comunicaciones
        console.log(`ComunicacionController: Usuario ${adminUser.id} (${rol}) solicitando TODOS los datos.`);
        const data = await ComunicacionService.getAll();
        res.json(data);

      } else if (rol === 'moderador') {
        // Rol 'moderador': Devuelve solo las asignadas
        console.log(`ComunicacionController: Usuario ${adminUser.id} (${rol}) solicitando datos ASIGNADOS.`);
        
        // **NECESITARÁS CREAR ESTA FUNCIÓN**
        // Esta función debe hacer un JOIN con la tabla 'seguimiento'
        // y filtrar donde 'id_admin_asignado' sea igual a adminId
        const data = await ComunicacionService.getByAdminAsignado(adminId); 
        
        res.json(data);
      } else {
        // Rol desconocido (no debería pasar gracias al middleware hasRole)
        return res.status(403).json({ error: "Rol no autorizado" });
      }

    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * MODIFICADO: Ahora verifica permisos para ver detalles
   * (Admins, Monitores, y Moderadores pueden ver detalles)
   * La ruta ya está protegida, así que no se necesita lógica extra aquí.
   */
  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      
      // Opcional: Podrías añadir lógica para que un moderador solo vea
      // detalles de un ticket si está asignado a él, pero por ahora
      // tu checklist no lo exige para esta ruta.
      
      const data = await ComunicacionService.getById(id);
      if (!data)
        return res.status(404).json({ error: "Comunicación no encontrada" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // --- RUTAS PÚBLICAS (No se modifican) ---

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
      const correo = req.body.correo || req.headers['x-user-email'] as string;
      const anonimo = req.body.anonimo !== undefined ? req.body.anonimo : (!correo); 
      
      const comunicacionData = {
        ...req.body,
        correo: correo || undefined,
        anonimo: anonimo 
      };
      
      const data = await ComunicacionService.create(comunicacionData);
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
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

  // --- RUTAS DE ADMIN (Protegidas por Rol en el archivo de rutas) ---

  /**
   * MODIFICADO: La ruta ya está protegida
   * Solo 'admin' puede llegar aquí (según comunicacionRoutes.ts)
   */
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

  /**
   * MODIFICADO: La ruta ya está protegida
   * Solo 'admin' puede llegar aquí (según comunicacionRoutes.ts)
   */
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