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

  static async getByComunicacionId(idComunicacion: number): Promise<Seguimiento | null> {
    const result = await pool.query<Seguimiento>(
      "SELECT * FROM seguimiento WHERE id_comunicacion=$1 ORDER BY fecha_actualizacion DESC LIMIT 1",
      [idComunicacion]
    );
    return result.rows[0] || null;
  }

  static async create(seguimiento: Omit<Seguimiento, "id_seguimiento" | "fecha_actualizacion">): Promise<Seguimiento> {
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
        seguimiento.prioridad || 'Media',
      ]
    );
    return result.rows[0];
  }

  static async update(id: number, seguimiento: Partial<Seguimiento>): Promise<Seguimiento | null> {
    const existente = await this.getById(id);
    if (!existente) return null;

    const updated = { ...existente, ...seguimiento };
    const result = await pool.query<Seguimiento>(
      `UPDATE seguimiento SET
        id_comunicacion=$1,
        id_estado=$2,
        id_miembro=$3,
        responsable=$4,
        fecha_actualizacion=NOW(),
        fecha_resolucion=$5,
        notas=$6,
        prioridad=$7
       WHERE id_seguimiento=$8
       RETURNING *`,
      [
        updated.id_comunicacion,
        updated.id_estado,
        updated.id_miembro,
        updated.responsable,
        updated.fecha_resolucion,
        updated.notas,
        updated.prioridad || 'Media',
        id,
      ]
    );
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM seguimiento WHERE id_seguimiento=$1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
