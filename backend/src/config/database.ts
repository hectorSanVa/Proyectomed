import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Carga las variables de entorno desde .env

// Configuración del pool de conexión
// Render proporciona DATABASE_URL, si no existe, usar variables individuales
const getDatabaseConfig = () => {
  // Si existe DATABASE_URL (proporcionado por Render), usarlo
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false // Render requiere SSL pero puede tener certificados autofirmados
      } : false,
      client_encoding: 'UTF8',
    };
  }

  // Configuración local (desarrollo)
  return {
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    client_encoding: 'UTF8',
  };
};

const pool = new Pool(getDatabaseConfig());

// Opcional: verificar conexión al iniciar
pool.connect()
  .then(() => console.log("✅ Conexión a PostgreSQL exitosa"))
  .catch((err: Error) => console.error("❌ Error al conectar a PostgreSQL:", err));

export default pool;
