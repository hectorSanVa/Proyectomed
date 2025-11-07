import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Carga las variables de entorno desde .env

// Configuración del pool de conexión
const pool = new Pool({
  user: process.env.DB_USER,           // Usuario de PostgreSQL
  host: process.env.DB_HOST,           // Host (localhost si es local)
  database: process.env.DB_NAME,       // Nombre de la base de datos
  password: process.env.DB_PASSWORD,   // Contraseña
  port: Number(process.env.DB_PORT) || 5432, // Puerto (default 5432)
});

// Opcional: verificar conexión al iniciar
pool.connect()
  .then(() => console.log("✅ Conexión a PostgreSQL exitosa"))
  .catch(err => console.error("❌ Error al conectar a PostgreSQL:", err));

export default pool;
