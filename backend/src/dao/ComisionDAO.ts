import pool from "../config/database";
import { Comision } from "../models/Comision";

export class ComisionDAO {
  static async getAll(): Promise<Comision[]> {
    const result = await pool.query("SELECT * FROM comision");
    return result.rows;
  }

  static async getById(id: number): Promise<Comision | null> {
    const result = await pool.query(
      "SELECT * FROM comision WHERE id_miembro=$1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(comision: Comision): Promise<Comision> {
    const result = await pool.query(
      "INSERT INTO comision (nombre, rol, periodo_inicio, periodo_fin) VALUES ($1,$2,$3,$4) RETURNING *",
      [
        comision.nombre,
        comision.rol,
        comision.periodo_inicio ?? null,
        comision.periodo_fin ?? null,
      ]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    data: Partial<Comision>
  ): Promise<Comision | null> {
    const fields = Object.keys(data)
      .map((key, i) => `"${key}"=$${i + 1}`)
      .join(", ");
    const values = Object.values(data);
    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE comision SET ${fields} WHERE id_miembro=$${
        values.length + 1
      } RETURNING *`,
      [...values, id]
    );

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM comision WHERE id_miembro=$1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
