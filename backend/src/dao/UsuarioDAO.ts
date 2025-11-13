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

  static async getByCorreo(correo: string): Promise<Usuario | null> {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [correo]
    );
    const usuario = result.rows[0] || null;
    if (usuario) {
      console.log(`✅ Usuario encontrado: correo=${correo}, id_usuario=${usuario.id_usuario}`);
    } else {
      console.log(`ℹ️ Usuario no encontrado: correo=${correo}`);
    }
    return usuario;
  }

  /**
   * Crear o obtener usuario por correo (útil para seguimiento de comunicaciones)
   * Si el usuario existe, lo retorna. Si no, crea uno mínimo con solo el correo.
   * Los campos tienen valores por defecto según las restricciones de la tabla
   */
  static async createOrGetByCorreo(correo: string): Promise<Usuario> {
    // Buscar usuario existente
    const existente = await this.getByCorreo(correo);
    if (existente) {
      console.log(`✅ Usuario existente encontrado: ${correo} (ID: ${existente.id_usuario})`);
      return existente;
    }

    // Crear usuario mínimo para seguimiento
    // Usamos valores por defecto que cumplan con los CHECK constraints
    const nombreMinimo = correo.split('@')[0] || 'Usuario';
    console.log(`📝 Creando nuevo usuario para seguimiento: ${correo}`);
    const result = await pool.query(
      `INSERT INTO usuarios (correo, nombre, telefono, semestre_area, tipo_usuario, sexo, confidencial, autorizo_contacto) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        correo,
        nombreMinimo, // Nombre mínimo derivado del correo
        '', // Telefono vacío (VARCHAR permite vacío)
        '', // Semestre/area vacío (VARCHAR permite vacío)
        'Estudiante', // Tipo usuario por defecto (requerido por CHECK)
        'Prefiero no responder', // Sexo por defecto (requerido por CHECK)
        true, // Confidencial por defecto
        false // No autoriza contacto por defecto
      ]
    );
    console.log(`✅ Usuario creado: ${correo} (ID: ${result.rows[0].id_usuario})`);
    return result.rows[0];
  }

  static async create(usuario: Usuario): Promise<Usuario> {
    // Asegurar valores por defecto para campos que tienen CHECK constraints
    const nombre = usuario.nombre || usuario.correo.split('@')[0] || 'Usuario';
    const tipoUsuario = usuario.tipo_usuario || 'Estudiante';
    const sexo = usuario.sexo || 'Prefiero no responder';
    const telefono = usuario.telefono || '';
    const semestreArea = usuario.semestre_area || '';
    
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, correo, telefono, semestre_area, tipo_usuario, sexo, confidencial, autorizo_contacto) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        nombre,
        usuario.correo,
        telefono,
        semestreArea,
        tipoUsuario,
        sexo,
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
