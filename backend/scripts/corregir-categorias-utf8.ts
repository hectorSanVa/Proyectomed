import pool from '../src/config/database';

async function corregirCategorias() {
  try {
    console.log('🔄 Corrigiendo categorías con caracteres especiales...');
    
    // Actualizar "Asuntos Académicos" para asegurar UTF-8 correcto
    await pool.query(`
      UPDATE categorias 
      SET nombre_categoria = 'Asuntos Académicos'
      WHERE nombre_categoria LIKE 'Asuntos%Acad%';
    `);
    
    console.log('✅ Categorías corregidas exitosamente');
    
    // Verificar que se actualizó correctamente
    const result = await pool.query('SELECT * FROM categorias WHERE nombre_categoria LIKE \'%Académicos%\'');
    console.log('📋 Categoría verificada:', result.rows[0]);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error al corregir categorías:', error.message);
    process.exit(1);
  }
}

corregirCategorias();



