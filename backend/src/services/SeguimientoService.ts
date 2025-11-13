import { Seguimiento } from "../models/Seguimiento";
import { SeguimientoDAO } from "../dao/SeguimientoDAO";
import { EstadoService } from "./EstadoService";

export class SeguimientoService {
  static async getAll(): Promise<Seguimiento[]> {
    return await SeguimientoDAO.getAll();
  }

  static async getById(id: number): Promise<Seguimiento | null> {
    return await SeguimientoDAO.getById(id);
  }

  static async getByComunicacionId(idComunicacion: number): Promise<Seguimiento | null> {
    return await SeguimientoDAO.getByComunicacionId(idComunicacion);
  }

  /**
   * Establece fecha_resolucion automáticamente si el estado es "Cerrada" o "Atendida"
   */
  private static async setFechaResolucionIfNeeded(
    seguimiento: Partial<Seguimiento>,
    idEstado?: number
  ): Promise<Partial<Seguimiento>> {
    // Si ya tiene fecha_resolucion, no la cambiamos
    if (seguimiento.fecha_resolucion) {
      return seguimiento;
    }

    // Si no hay id_estado, no podemos determinar el estado
    if (!idEstado && !seguimiento.id_estado) {
      return seguimiento;
    }

    const estadoId = idEstado || seguimiento.id_estado;
    if (!estadoId) {
      return seguimiento;
    }

    try {
      // Obtener el estado para verificar su nombre
      const estado = await EstadoService.getById(estadoId);
      if (!estado) {
        return seguimiento;
      }

      const nombreEstado = estado.nombre_estado.toLowerCase();
      
      // Si el estado es "Cerrada" o "Atendida", establecer fecha_resolucion
      if (nombreEstado === 'cerrada' || nombreEstado === 'atendida') {
        return {
          ...seguimiento,
          fecha_resolucion: new Date().toISOString().split('T')[0] // Fecha actual en formato YYYY-MM-DD
        };
      }
    } catch (error) {
      console.warn('Error al verificar estado para fecha_resolucion:', error);
    }

    return seguimiento;
  }

  static async create(
    seguimiento: Omit<Seguimiento, "id_seguimiento" | "fecha_actualizacion">
  ): Promise<Seguimiento> {
    // Establecer fecha_resolucion si es necesario
    const seguimientoConFecha = await this.setFechaResolucionIfNeeded(
      seguimiento,
      seguimiento.id_estado
    );
    
    return await SeguimientoDAO.create(seguimientoConFecha as Omit<Seguimiento, "id_seguimiento" | "fecha_actualizacion">);
  }

  static async update(
    id: number,
    seguimiento: Partial<Seguimiento>
  ): Promise<Seguimiento | null> {
    // Si se está actualizando el estado, verificar si necesitamos establecer fecha_resolucion
    if (seguimiento.id_estado) {
      const seguimientoExistente = await this.getById(id);
      if (seguimientoExistente) {
        // Establecer fecha_resolucion si el nuevo estado lo requiere
        const seguimientoConFecha = await this.setFechaResolucionIfNeeded(
          {
            ...seguimiento,
            fecha_resolucion: seguimiento.fecha_resolucion || seguimientoExistente.fecha_resolucion
          },
          seguimiento.id_estado
        );
        return await SeguimientoDAO.update(id, seguimientoConFecha);
      }
    }
    
    return await SeguimientoDAO.update(id, seguimiento);
  }

  static async delete(id: number): Promise<boolean> {
    return await SeguimientoDAO.delete(id);
  }
}
