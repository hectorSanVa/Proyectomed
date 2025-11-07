import pool from "../config/database";
import { Estado } from "../models/Estado";

export class EstadoDAO {
  static async getAll(): Promise<Estado[]> {
    const result = await pool.query("SELECT * FROM estados");
    return result.rows;
  }

  static async getById(id: number): Promise<Estado | null> {
    const result = await pool.query(
      "SELECT * FROM estados WHERE id_estado = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(estado: Estado): Promise<Estado> {
    const result = await pool.query(
      "INSERT INTO estados (nombre_estado) VALUES ($1) RETURNING *",
      [estado.nombre_estado]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    data: Partial<Estado>
  ): Promise<Estado | null> {
    const fields = Object.keys(data)
      .map((key, i) => `"${key}"=$${i + 1}`)
      .join(", ");

    const values = Object.values(data);

    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE estados SET ${fields} WHERE id_estado=$${
        values.length + 1
      } RETURNING *`,
      [...values, id]
    );

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM estados WHERE id_estado=$1", [
      id,
    ]);
    return (result.rowCount ?? 0) > 0;
  }
}
