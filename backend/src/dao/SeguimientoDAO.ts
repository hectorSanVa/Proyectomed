import pool from "../config/database";
import { Seguimiento } from "../models/Seguimiento";

export class SeguimientoDAO {
  static async getAll(): Promise<Seguimiento[]> {
    const result = await pool.query<Seguimiento>("SELECT * FROM seguimiento");
    return result.rows;
  }

  static async getById(id: number): Promise<Seguimiento | null> {
    const result = await pool.query<Seguimiento>(
      "SELECT * FROM seguimiento WHERE id_seguimiento=$1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async getByComunicacionId(
    idComunicacion: number
  ): Promise<Seguimiento | null> {
    const result = await pool.query<Seguimiento>(
      "SELECT * FROM seguimiento WHERE id_comunicacion=$1 ORDER BY fecha_actualizacion DESC LIMIT 1",
      [idComunicacion]
    );
    return result.rows[0] || null;
  }

  static async create(
    seguimiento: Omit<Seguimiento, "id_seguimiento" | "fecha_actualizacion">
  ): Promise<Seguimiento> {
    const result = await pool.query<Seguimiento>(
      `INSERT INTO seguimiento 
        (id_comunicacion, id_estado, id_miembro, responsable, fecha_resolucion, notas, prioridad)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        seguimiento.id_comunicacion,
        seguimiento.id_estado,
        seguimiento.id_miembro,
        seguimiento.responsable,
        seguimiento.fecha_resolucion,
        seguimiento.notas,
        seguimiento.prioridad || "Media",
        seguimiento.id_admin_asignado || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Actualiza un seguimiento dinámicamente.
   * Permite actualizaciones parciales (ej. solo 'notas' o solo 'id_admin_asignado').
   */
  static async update(
    id: number,
    seguimiento: Partial<Seguimiento>
  ): Promise<Seguimiento | null> {
    // Campos que se pueden actualizar
    const allowedFields = [
      "id_comunicacion",
      "id_estado",
      "id_miembro",
      "responsable",
      "fecha_resolucion",
      "notas",
      "prioridad",
      "id_admin_asignado",
    ];

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    // Construir la consulta dinámicamente
    Object.entries(seguimiento).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        fieldsToUpdate.push(`"${key}"=$${values.length + 1}`);
        values.push(value);
      }
    });

    // Añadir siempre la fecha de actualización
    fieldsToUpdate.push(`fecha_actualizacion=NOW()`);

    if (fieldsToUpdate.length === 0) {
      // No hay nada que actualizar
      return await this.getById(id);
    }

    const setClause = fieldsToUpdate.join(", ");
    values.push(id); // Añadir el ID para el WHERE

    const query = `UPDATE seguimiento SET ${setClause} 
                   WHERE id_seguimiento=$${values.length} 
                   RETURNING *`;

    const result = await pool.query<Seguimiento>(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM seguimiento WHERE id_seguimiento=$1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
