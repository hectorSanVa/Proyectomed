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
    console.log(`🔍 Buscando comunicaciones para usuario ID: ${idUsuario}`);
    const result = await pool.query(
      "SELECT * FROM comunicaciones WHERE id_usuario=$1 ORDER BY fecha_recepcion DESC",
      [idUsuario]
    );
    console.log(`✅ Encontradas ${result.rows.length} comunicaciones para usuario ID: ${idUsuario}`);
    if (result.rows.length > 0) {
      result.rows.forEach((com, idx) => {
        console.log(`  ${idx + 1}. Folio: ${com.folio}, Tipo: ${com.tipo}, id_usuario: ${com.id_usuario}`);
      });
    }
    return result.rows;
  }

  static async getByFolio(folio: string): Promise<Comunicacion | null> {
    const result = await pool.query(
      "SELECT * FROM comunicaciones WHERE folio=$1",
      [folio]
    );
    return result.rows[0] || null;
  }

  static async create(
    comunicacion: Omit<Comunicacion, "id_comunicacion" | "folio" | "fecha_recepcion"> & { medio?: 'F' | 'D' }
  ): Promise<Comunicacion> {
    const medio = comunicacion.medio || 'D'; // Por defecto Digital
    
    console.log(`📝 Creando comunicación con id_usuario: ${comunicacion.id_usuario}, medio: ${medio}`);
    
    // Intentar insertar con medio, si falla por que no existe la columna, insertar sin medio
    try {
      const result = await pool.query<Comunicacion>(
        `INSERT INTO comunicaciones (tipo, id_usuario, id_categoria, descripcion, area_involucrada, medio)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
        [
          comunicacion.tipo,
          comunicacion.id_usuario || null, // Asegurar que sea null si es undefined
          comunicacion.id_categoria,
          comunicacion.descripcion,
          comunicacion.area_involucrada,
          medio,
        ]
      );
      console.log(`✅ Comunicación creada: ID=${result.rows[0].id_comunicacion}, Folio=${result.rows[0].folio}, id_usuario=${result.rows[0].id_usuario}`);
      return result.rows[0];
    } catch (error: any) {
      // Si el campo medio no existe, intentar sin él
      if (error.message?.includes('column "medio"')) {
        console.log(`⚠️ Campo 'medio' no existe, insertando sin él`);
        const result = await pool.query<Comunicacion>(
          `INSERT INTO comunicaciones (tipo, id_usuario, id_categoria, descripcion, area_involucrada)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
          [
            comunicacion.tipo,
            comunicacion.id_usuario || null, // Asegurar que sea null si es undefined
            comunicacion.id_categoria,
            comunicacion.descripcion,
            comunicacion.area_involucrada,
          ]
        );
        console.log(`✅ Comunicación creada (sin medio): ID=${result.rows[0].id_comunicacion}, Folio=${result.rows[0].folio}, id_usuario=${result.rows[0].id_usuario}`);
        return result.rows[0];
      }
      throw error;
    }
  }

  static async update(
    id: number,
    data: Partial<Comunicacion>
  ): Promise<Comunicacion | null> {
    // Campos permitidos para actualizar
    const allowedFields = [
      'tipo', 'id_usuario', 'id_categoria', 'descripcion', 
      'area_involucrada', 'mostrar_publico'
    ];
    
    // Filtrar solo campos permitidos y que tengan valor
    const filteredData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        filteredData[key] = value;
      }
    }
    
    if (Object.keys(filteredData).length === 0) {
      console.warn('⚠️ No hay campos válidos para actualizar');
      return null;
    }
    
    // Verificar si la columna mostrar_publico existe antes de intentar actualizarla
    if (filteredData.mostrar_publico !== undefined) {
      try {
        const columnCheck = await pool.query(
          `SELECT column_name 
           FROM information_schema.columns 
           WHERE table_name = 'comunicaciones' 
           AND column_name = 'mostrar_publico'`
        );
        
        if (columnCheck.rows.length === 0) {
          console.warn('⚠️ Columna mostrar_publico no existe en la base de datos');
          console.log('💡 Intentando agregar la columna automáticamente...');
          
          // Intentar agregar la columna automáticamente
          try {
            await pool.query(
              `ALTER TABLE comunicaciones 
               ADD COLUMN IF NOT EXISTS mostrar_publico BOOLEAN DEFAULT FALSE`
            );
            console.log('✅ Columna mostrar_publico agregada exitosamente');
            // No eliminar de filteredData, ahora la columna existe
          } catch (alterError: any) {
            console.error('❌ Error al agregar columna mostrar_publico:', alterError.message);
            // Si falla, eliminar de filteredData y continuar sin actualizar este campo
            delete filteredData.mostrar_publico;
            // Si solo se estaba intentando actualizar mostrar_publico, retornar la comunicación actual
            if (Object.keys(filteredData).length === 0) {
              console.warn('⚠️ Solo se intentaba actualizar mostrar_publico, pero la columna no existe y no se pudo crear. Retornando comunicación actual.');
              return await this.getById(id);
            }
          }
        } else {
          console.log('✅ Columna mostrar_publico existe en la base de datos');
        }
      } catch (error: any) {
        console.warn('⚠️ Error al verificar columna mostrar_publico:', error.message);
        // En caso de error, intentar continuar con la actualización
        // Si falla, se manejará en el catch del query principal
      }
    }
    
    if (Object.keys(filteredData).length === 0) {
      console.warn('⚠️ No hay campos válidos para actualizar después del filtrado');
      // Retornar la comunicación actual en lugar de null
      return await this.getById(id);
    }
    
    // Construir la consulta SQL de forma más segura
    const fieldNames = Object.keys(filteredData);
    const fieldValues = Object.values(filteredData);
    
    if (fieldNames.length === 0) {
      console.warn('⚠️ No hay campos para actualizar');
      return await this.getById(id);
    }
    
    const setClause = fieldNames
      .map((key, i) => `"${key}"=$${i + 1}`)
      .join(", ");
    
    const whereParamIndex = fieldNames.length + 1;
    const query = `UPDATE comunicaciones SET ${setClause} WHERE id_comunicacion=$${whereParamIndex} RETURNING *`;
    const params = [...fieldValues, id];
    
    console.log(`🔧 Actualizando comunicación ${id} con campos: ${fieldNames.join(', ')}`);
    console.log(`📝 Query: ${query}`);
    console.log(`📊 Parámetros: ${JSON.stringify(params)}`);
    
    try {
      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        console.warn(`⚠️ No se encontró comunicación con id ${id}`);
        return null;
      }

      console.log(`✅ Comunicación ${id} actualizada exitosamente`);
      return result.rows[0];
    } catch (error: any) {
      console.error('❌ Error al actualizar comunicación:', error);
      console.error('📝 Query que falló:', query);
      console.error('📊 Parámetros:', params);
      throw new Error(`Error al actualizar comunicación: ${error.message}`);
    }
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM comunicaciones WHERE id_comunicacion=$1",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  static async getReconocimientosPublicos(): Promise<Comunicacion[]> {
    try {
      // Primero verificar si la columna existe
      const columnCheck = await pool.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'comunicaciones' 
         AND column_name = 'mostrar_publico'`
      );
      
      if (columnCheck.rows.length === 0) {
        // Si la columna no existe, retornar todos los reconocimientos (comportamiento por defecto)
        console.log('⚠️ Columna mostrar_publico no existe, retornando todos los reconocimientos');
        const result = await pool.query(
          `SELECT * FROM comunicaciones 
           WHERE tipo = 'Reconocimiento' 
           ORDER BY fecha_recepcion DESC`
        );
        return result.rows;
      }
      
      // Si la columna existe, usar la consulta con el filtro
      const result = await pool.query(
        `SELECT * FROM comunicaciones 
         WHERE tipo = 'Reconocimiento' 
         AND mostrar_publico = TRUE 
         ORDER BY fecha_recepcion DESC`
      );
      return result.rows;
    } catch (error: any) {
      console.error('❌ Error en getReconocimientosPublicos:', error);
      // Si hay un error, intentar retornar todos los reconocimientos como fallback
      try {
        const result = await pool.query(
          `SELECT * FROM comunicaciones 
           WHERE tipo = 'Reconocimiento' 
           ORDER BY fecha_recepcion DESC`
        );
        return result.rows;
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        throw error; // Lanzar el error original
      }
    }
  }
}
