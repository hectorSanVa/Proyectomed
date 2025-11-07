import pool from "../config/database";
import { Comunicacion } from "../models/Comunicacion";

export class ComunicacionDAO {
  static async getAll(): Promise<Comunicacion[]> {
    const result = await pool.query("SELECT * FROM comunicaciones");
    return result.rows;
  }

  static async getById(id: number): Promise<Comunicacion | null> {
    const result = await pool.query(
      "SELECT * FROM comunicaciones WHERE id_comunicacion=$1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async getByUsuarioId(idUsuario: number): Promise<Comunicacion[]> {
    const result = await pool.query(
      "SELECT * FROM comunicaciones WHERE id_usuario=$1 ORDER BY fecha_recepcion DESC",
      [idUsuario]
    );
    return result.rows;
  }

  static async create(
    comunicacion: Omit<Comunicacion, "id_comunicacion" | "folio" | "fecha_recepcion"> & { medio?: 'F' | 'D' }
  ): Promise<Comunicacion> {
    const medio = comunicacion.medio || 'D'; // Por defecto Digital
    
    // Intentar insertar con medio, si falla por que no existe la columna, insertar sin medio
    try {
      const result = await pool.query<Comunicacion>(
        `INSERT INTO comunicaciones (tipo, id_usuario, id_categoria, descripcion, area_involucrada, medio)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
        [
          comunicacion.tipo,
          comunicacion.id_usuario,
          comunicacion.id_categoria,
          comunicacion.descripcion,
          comunicacion.area_involucrada,
          medio,
        ]
      );
      return result.rows[0];
    } catch (error: any) {
      // Si el campo medio no existe, intentar sin él
      if (error.message?.includes('column "medio"')) {
        const result = await pool.query<Comunicacion>(
          `INSERT INTO comunicaciones (tipo, id_usuario, id_categoria, descripcion, area_involucrada)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
          [
            comunicacion.tipo,
            comunicacion.id_usuario,
            comunicacion.id_categoria,
            comunicacion.descripcion,
            comunicacion.area_involucrada,
          ]
        );
        return result.rows[0];
      }
      throw error;
    }
  }

  static async update(
    id: number,
    data: Partial<Comunicacion>
  ): Promise<Comunicacion | null> {
    const fields = Object.keys(data)
      .map((key, i) => `"${key}"=$${i + 1}`)
      .join(", ");
    const values = Object.values(data);
    if (fields.length === 0) return null;

    const result = await pool.query(
      `UPDATE comunicaciones SET ${fields} WHERE id_comunicacion=${
        values.length + 1
      } RETURNING *`,
      [...values, id]
    );

    return result.rows[0] ?? null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM comunicaciones WHERE id_comunicacion=$1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
