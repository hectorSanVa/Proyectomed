import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import usuarioRoutes from "./routes/usuarioRoutes";
import categoriaRoutes from "./routes/categoriaRoutes";
import estadoRoutes from "./routes/estadoRoutes";
import comunicacionRoutes from "./routes/comunicacionRoutes";
import evidenciaRoutes from "./routes/evidenciaRoutes";
import seguimientoRoutes from "./routes/seguimientoRoutes";
import comisionRoutes from "./routes/comisionRoutes";
import folioRoutes from "./routes/folioRoutes";
import historialEstadoRoutes from "./routes/historialEstadoRoutes";
import authRoutes from "./routes/authRoutes";
import configuracionRoutes from "./routes/configuracionRoutes";
import usuarioAdminRoutes from "./routes/usuarioAdminRoutes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { runMigrations } from "./utils/runMigrations";

const app = express();

// Configuración de CORS
// Permite localhost para desarrollo y orígenes de producción configurados
const getAllowedOrigins = () => {
  const origins: string[] = [];
  
  // Siempre permitir localhost para desarrollo local
  origins.push('http://localhost:5173');
  origins.push('http://localhost:3000');
  origins.push('http://127.0.0.1:5173');
  
  // Agregar orígenes desde variables de entorno (producción)
  if (process.env.FRONTEND_URL) {
    const frontendUrls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    origins.push(...frontendUrls);
  }
  
  if (process.env.CORS_ORIGIN) {
    const corsUrls = process.env.CORS_ORIGIN.split(',').map(url => url.trim());
    origins.push(...corsUrls);
  }
  
  return origins;
};

const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permitir requests sin origin (ej: Postman, mobile apps, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Permitir localhost siempre (para desarrollo)
    const isLocalhost = origin.startsWith('http://localhost:') || 
                       origin.startsWith('http://127.0.0.1:') ||
                       origin.startsWith('http://0.0.0.0:');
    
    if (isLocalhost) {
      return callback(null, true);
    }
    
    // En desarrollo local del backend, permitir cualquier origen
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return callback(null, true);
    }
    
    // En producción, permitir orígenes configurados en variables de entorno
    const isAllowed = allowedOrigins.some(allowed => {
      return origin === allowed || origin.startsWith(allowed);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS: Origen no permitido: ${origin}`);
      console.warn(`⚠️ Orígenes permitidos:`, allowedOrigins);
      // En producción, solo permitir orígenes configurados
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('No permitido por CORS. Configure FRONTEND_URL en Render.'));
      } else {
        // En desarrollo, permitir de todos modos
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Permitir que se sirvan archivos desde otros orígenes
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Middleware para asegurar UTF-8 en las respuestas
app.use((req, res, next) => {
  res.charset = 'utf-8';
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de uploads
import path from "path";
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rutas
app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/estados", estadoRoutes);
app.use("/comunicaciones", comunicacionRoutes);
app.use("/evidencias", evidenciaRoutes);
app.use("/seguimientos", seguimientoRoutes);
app.use("/comisiones", comisionRoutes);
app.use("/folios", folioRoutes);
app.use("/historial-estados", historialEstadoRoutes);
app.use("/configuracion", configuracionRoutes);
app.use("/api/admin/users", usuarioAdminRoutes);

// Ruta de prueba para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  res.json({ 
    message: "API del Buzón de Quejas, Sugerencias y Reconocimientos UNACH", 
    status: "ok",
    version: "1.0.0",
    endpoints: {
      categorias: "/categorias",
      estados: "/estados",
      comunicaciones: "/comunicaciones",
      usuarios: "/usuarios",
      auth: "/auth"
    }
  });
});

// Middleware para rutas no encontradas (404) - debe ir después de todas las rutas
app.use(notFoundHandler);

// Middleware de manejo de errores (debe ir al final, con 4 parámetros para que Express lo reconozca como error handler)
app.use(errorHandler as express.ErrorRequestHandler);

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
async function startServer() {
  try {
    // Ejecutar migraciones antes de iniciar el servidor
    // Si fallan, el servidor aún puede iniciar (las migraciones se pueden ejecutar manualmente)
    try {
      await runMigrations();
      console.log('✅ Migraciones completadas exitosamente');
    } catch (migrationError: any) {
      console.error('⚠️ Error en migraciones (el servidor continuará iniciando):', migrationError.message);
      console.error('⚠️ Stack:', migrationError.stack);
      // No detener el servidor si las migraciones fallan
      // El servidor puede funcionar si las tablas ya existen
    }
    
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
      console.log(`🌐 API disponible en http://localhost:${PORT}`);
      console.log(`📋 Rutas disponibles:`);
      console.log(`  - GET  /categorias`);
      console.log(`  - GET  /estados`);
      console.log(`  - GET  /comunicaciones`);
      console.log(`  - POST /comunicaciones`);
      console.log(`  - GET  /usuarios`);
      console.log(`  - POST /usuarios/login`);
      console.log(`  - GET  /configuracion/data`);
      console.log(`  - PUT  /configuracion/data`);
      console.log(`  - GET, POST, PUT, DELETE /api/admin/users`);
    });
  } catch (error: any) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    console.error('❌ Stack:', error.stack);
    process.exit(1);
  }
}

startServer();
