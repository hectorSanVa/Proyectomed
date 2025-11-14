import pool from "../config/database";
import { UsuarioAdmin } from "../models/UsuarioAdmin";

// Tipo para el usuario sin password, para retornos seguros
export type UsuarioAdminSinPassword = Omit<UsuarioAdmin, 'password'>;

export class UsuarioAdminDAO {
  
  /**
   * Obtiene un usuario admin por su username (incluyendo la contraseña hasheada)
   * Usado solo para el login
   */
  static async getByUsername(username: string): Promise<UsuarioAdmin | null> {
    const result = await pool.query<UsuarioAdmin>(
      "SELECT * FROM usuarios_admin WHERE username = $1",
      [username]
    );
    return result.rows[0] || null;
  }
  
  /**
   * Obtiene un usuario admin por su ID (sin contraseña)
   */
  static async getById(id: number): Promise<UsuarioAdminSinPassword | null> {
    const result = await pool.query<UsuarioAdminSinPassword>(
      "SELECT id_admin, username, nombre, rol FROM usuarios_admin WHERE id_admin = $1",
      [id]
    );
    return result.rows[0] || null;
  }
  
  /**
   * Obtiene todos los usuarios admin (sin contraseñas)
   */
  static async getAll(): Promise<UsuarioAdminSinPassword[]> {
    const result = await pool.query<UsuarioAdminSinPassword>(
      "SELECT id_admin, username, nombre, rol FROM usuarios_admin"
    );
    return result.rows;
  }
  
  /**
   * Crea un nuevo usuario admin
   */
  static async create(usuario: UsuarioAdmin): Promise<UsuarioAdmin> {
    const result = await pool.query<UsuarioAdmin>(
      `INSERT INTO usuarios_admin (username, password, nombre, rol) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [usuario.username, usuario.password, usuario.nombre, usuario.rol]
    );
    return result.rows[0];
  }

  /**
   * Actualiza un usuario admin
   * Nota: Este DAO no maneja el hash de la contraseña, el Service lo hará
   */
  static async update(id: number, data: Partial<UsuarioAdmin>): Promise<UsuarioAdminSinPassword | null> {
    const fields = Object.keys(data)
      .map((key, i) => `"${key}"=$${i + 1}`)
      .join(", ");

    const values = Object.values(data);
    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE usuarios_admin SET ${fields} 
       WHERE id_admin=$${values.length + 1} 
       RETURNING id_admin, username, nombre, rol`,
      [...values, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Elimina un usuario admin
   */
  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM usuarios_admin WHERE id_admin=$1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}