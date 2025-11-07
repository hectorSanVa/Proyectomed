import pool from "../config/database";
import { HistorialEstado } from "../models/HistorialEstado";

export class HistorialEstadoDAO {
  static async getAll(): Promise<HistorialEstado[]> {
    const result = await pool.query<HistorialEstado>(
      "SELECT * FROM historial_estados"
    );
    return result.rows;
  }

  static async getById(id: number): Promise<HistorialEstado | null> {
    const result = await pool.query<HistorialEstado>(
      "SELECT * FROM historial_estados WHERE id_historial=$1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async getByComunicacionId(idComunicacion: number): Promise<HistorialEstado[]> {
    const result = await pool.query<HistorialEstado>(
      "SELECT * FROM historial_estados WHERE id_comunicacion=$1 ORDER BY fecha_actualizacion DESC",
      [idComunicacion]
    );
    return result.rows;
  }

  static async create(
    historial: Omit<HistorialEstado, "id_historial" | "fecha_actualizacion">
  ): Promise<HistorialEstado> {
    const result = await pool.query<HistorialEstado>(
      `INSERT INTO historial_estados 
        (id_comunicacion, id_estado, responsable, notas)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [
        historial.id_comunicacion,
        historial.id_estado,
        historial.responsable,
        historial.notas,
      ]
    );
    return result.rows[0];
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM historial_estados WHERE id_historial=$1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
