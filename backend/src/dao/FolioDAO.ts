import pool from "../config/database";
import { Folio } from "../models/Folio";

export class FolioDAO {
  static async getAll(): Promise<Folio[]> {
    const result = await pool.query<Folio>("SELECT * FROM folios");
    return result.rows;
  }

  static async getByMedioAnio(
    medio: "F" | "D",
    anio: number
  ): Promise<Folio | null> {
    const result = await pool.query<Folio>(
      "SELECT * FROM folios WHERE medio=$1 AND anio=$2",
      [medio, anio]
    );
    return result.rows[0] || null;
  }
}
