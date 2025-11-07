import pool from "../config/database";
import { Categoria } from "../models/Categoria";

export class CategoriaDAO {
  static async getAll(): Promise<Categoria[]> {
    const result = await pool.query("SELECT * FROM categorias");
    return result.rows;
  }

  static async getById(id: number): Promise<Categoria | null> {
    const result = await pool.query(
      "SELECT * FROM categorias WHERE id_categoria = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(categoria: Categoria): Promise<Categoria> {
    const result = await pool.query(
      "INSERT INTO categorias (nombre_categoria) VALUES ($1) RETURNING *",
      [categoria.nombre_categoria]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    data: Partial<Categoria>
  ): Promise<Categoria | null> {
    const fields = Object.keys(data)
      .map((key, i) => `"${key}"=$${i + 1}`)
      .join(", ");

    const values = Object.values(data);

    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE categorias SET ${fields} WHERE id_categoria=$${
        values.length + 1
      } RETURNING *`,
      [...values, id]
    );

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM categorias WHERE id_categoria=$1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
