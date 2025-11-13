import pool from '../src/config/database';

async function ejecutarMigracion() {
  try {
    console.log('🔄 Ejecutando migración: agregar columna mostrar_publico...');
    
    // Agregar columna si no existe
    await pool.query(`
      ALTER TABLE comunicaciones 
      ADD COLUMN IF NOT EXISTS mostrar_publico BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Columna mostrar_publico agregada (o ya existía)');

    // Crear índice para mejorar el rendimiento
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_comunicaciones_mostrar_publico 
      ON comunicaciones(tipo, mostrar_publico) 
      WHERE tipo = 'Reconocimiento';
    `);
    console.log('✅ Índice creado (o ya existía)');

    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error al ejecutar migración:', error.message);
    process.exit(1);
  }
}

ejecutarMigracion();



