import pool from '../src/config/database';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { AdminRol } from '../src/models/UsuarioAdmin'; // Importa los roles válidos

// Cargar variables de entorno desde backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const saltRounds = 10;
const validRoles: AdminRol[] = ['admin', 'monitor', 'moderador']; // Roles permitidos

/**
 * Muestra todos los administradores en la base de datos (con hashes)
 */
async function listAdmins() {
  console.log('Obteniendo lista de administradores (CON HASHES)...');
  try {
    const { rows } = await pool.query(
      'SELECT id_admin, username, nombre, rol, password FROM usuarios_admin ORDER BY id_admin'
    );
    
    if (rows.length === 0) {
      console.log('No se encontraron usuarios administradores.');
      return;
    }

    console.warn("***************** ADVERTENCIA DE SEGURIDAD *****************");
    console.warn("Estás mostrando los hashes de las contraseñas.");
    console.warn("No compartas esta salida con nadie.");
    console.warn("**********************************************************");
    console.table(rows);
  } catch (error: any) {
    console.error('Error al listar administradores:', error.message);
  }
}

/**
 * Agrega un nuevo administrador a la base de datos
 */
async function addAdmin(
  username: string,
  password: string,
  nombre: string,
  rol: AdminRol
) {
  console.log(`Intentando agregar administrador: ${username} (Rol: ${rol})`);

  if (!validRoles.includes(rol)) {
    console.error(`Error: Rol inválido "${rol}". Roles válidos: ${validRoles.join(', ')}`);
    return;
  }

  if (!username || !password || !nombre) {
    console.error('Error: Faltan argumentos. Uso: add <username> <password> <nombre> <rol>');
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Contraseña hasheada.');

    const { rows } = await pool.query(
      `INSERT INTO usuarios_admin (username, password, nombre, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id_admin, username, nombre, rol`,
      [username, hashedPassword, nombre, rol]
    );

    console.log('¡Administrador creado exitosamente!');
    console.table(rows);
  } catch (error: any) {
    if (error.code === '23505') {
      console.error(`Error: El nombre de usuario "${username}" ya existe.`);
    } else {
      console.error('Error al agregar administrador:', error.message);
    }
  }
}

/**
 * ¡NUEVA FUNCIÓN!
 * Borra TODOS los administradores y crea uno nuevo: admin / admin123
 */
async function resetAdminTable() {
  console.warn("********************** ADVERTENCIA **********************");
  console.warn("Esto borrará TODOS los usuarios administradores existentes.");
  console.warn("Creará un único usuario: admin / admin123");
  console.warn("*********************************************************");

  // Confirmación de seguridad
  if (process.argv[3] !== 'reset-confirm') {
    console.error("Error: Acción peligrosa. Para confirmar, debe ejecutar:");
    console.error("npm run manage-admins reset reset-confirm");
    return;
  }

  console.log("Confirmación recibida. Reiniciando tabla de administradores...");

  try {
    // 1. Hashear la nueva contraseña 'admin123'
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log(`Hash para "${newPassword}" generado.`);

    // 2. Iniciar una transacción
    await pool.query('BEGIN');

    // 3. Borrar todos los usuarios existentes
    const deleteResult = await pool.query('DELETE FROM usuarios_admin');
    console.log(`Se eliminaron ${deleteResult.rowCount} usuarios existentes.`);

    // 4. Insertar el nuevo usuario 'admin'
    const { rows } = await pool.query(
      `INSERT INTO usuarios_admin (username, password, nombre, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id_admin, username, nombre, rol`,
      ['admin', hashedPassword, 'Administrador Principal', 'admin']
    );

    // 5. Confirmar la transacción
    await pool.query('COMMIT');

    console.log('¡Tabla de administradores reiniciada exitosamente!');
    console.log('Usuario creado:');
    console.table(rows);

  } catch (error: any) {
    // 6. Revertir en caso de error
    await pool.query('ROLLBACK');
    console.error('Error al reiniciar la tabla de administradores:', error.message);
    console.error('La transacción ha sido revertida. No se realizaron cambios.');
  }
}


/**
 * Función principal para ejecutar el script
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('--- Script de Gestión de Administradores ---');

  if (!process.env.DATABASE_URL) {
    console.error('Error: Variable de entorno DATABASE_URL no encontrada.');
    console.log('Asegúrate de tener un archivo .env en la carpeta /backend con la URL de tu BD de Render.');
    return;
  }
  
  if (process.env.NODE_ENV !== 'production') {
     console.warn(`ADVERTENCIA: NODE_ENV no es 'production'. Asegúrate de que esté como 'production' en .env para la conexión SSL a Render.`);
  }

  switch (command) {
    case 'list':
      await listAdmins();
      break;
    
    case 'add':
      const [username, password, nombre, rol] = args.slice(1);
      await addAdmin(username, password, nombre, rol as AdminRol);
      break;

    // --- NUEVO COMANDO AÑADIDO ---
    case 'reset':
      await resetAdminTable();
      break;
    
    default:
      console.log('Comando no reconocido.');
      console.log('Uso:');
      console.log('  npm run manage-admins list');
      console.log('  npm run manage-admins add <username> <password> <nombre> <rol>');
      console.log('  npm run manage-admins reset reset-confirm  <-- ¡CUIDADO!');
  }

  await pool.end();
  console.log('--- Conexión a la base de datos cerrada ---');
}

main().catch(err => {
  console.error('Error inesperado:', err);
  pool.end();
});