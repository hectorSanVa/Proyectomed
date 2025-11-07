import pool from "../config/database";
import { Usuario } from "../models/Usuario";

export class UsuarioDAO {
  static async getAll(): Promise<Usuario[]> {
    const result = await pool.query("SELECT * FROM usuarios");
    return result.rows;
  }

  static async getById(id: number): Promise<Usuario | null> {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE id_usuario = $1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(usuario: Usuario): Promise<Usuario> {
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, telefono, semestre_area, tipo_usuario, sexo, confidencial, autorizo_contacto) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        usuario.nombre,
        usuario.correo,
        usuario.telefono,
        usuario.semestre_area,
        usuario.tipo_usuario,
        usuario.sexo,
        usuario.confidencial ?? true,
        usuario.autorizo_contacto ?? false,
      ]
    );
    return result.rows[0];
  }

  static async update(
    id: number,
    data: Partial<Usuario>
  ): Promise<Usuario | null> {
    const fields = Object.keys(data)
      .map((key, i) => `"${key}"=$${i + 1}`)
      .join(", ");

    const values = Object.values(data);

    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE usuarios SET ${fields} WHERE id_usuario=$${
        values.length + 1
      } RETURNING *`,
      [...values, id]
    );

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM usuarios WHERE id_usuario=$1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
