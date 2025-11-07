import pool from "../config/database";
import { Evidencia } from "../models/Evidencia";

export class EvidenciaDAO {
  static async getAll(): Promise<Evidencia[]> {
    const result = await pool.query<Evidencia>("SELECT * FROM evidencias");
    return result.rows;
  }

  static async getById(id: number): Promise<Evidencia | null> {
    const result = await pool.query<Evidencia>(
      "SELECT * FROM evidencias WHERE id_evidencia=$1",
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(evidencia: Omit<Evidencia, "id_evidencia" | "fecha_subida">): Promise<Evidencia> {
    const result = await pool.query<Evidencia>(
      `INSERT INTO evidencias 
        (id_comunicacion, tipo_archivo, nombre_archivo, ruta_archivo, tamano_bytes, hash_sha256)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        evidencia.id_comunicacion,
        evidencia.tipo_archivo,
        evidencia.nombre_archivo,
        evidencia.ruta_archivo,
        evidencia.tamano_bytes,
        evidencia.hash_sha256,
      ]
    );
    return result.rows[0];
  }

  static async update(id: number, evidencia: Partial<Evidencia>): Promise<Evidencia | null> {
    const existente = await this.getById(id);
    if (!existente) return null;

    const updated = { ...existente, ...evidencia };
    const result = await pool.query<Evidencia>(
      `UPDATE evidencias SET 
        id_comunicacion=$1,
        tipo_archivo=$2,
        nombre_archivo=$3,
        ruta_archivo=$4,
        tamano_bytes=$5,
        hash_sha256=$6
       WHERE id_evidencia=$7
       RETURNING *`,
      [
        updated.id_comunicacion,
        updated.tipo_archivo,
        updated.nombre_archivo,
        updated.ruta_archivo,
        updated.tamano_bytes,
        updated.hash_sha256,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM evidencias WHERE id_evidencia=$1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  static async getByComunicacionId(idComunicacion: number): Promise<Evidencia[]> {
    const result = await pool.query<Evidencia>(
      "SELECT * FROM evidencias WHERE id_comunicacion=$1 ORDER BY fecha_subida DESC",
      [idComunicacion]
    );
    return result.rows;
  }
}
