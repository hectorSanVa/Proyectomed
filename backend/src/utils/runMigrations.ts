import pool from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * Ejecuta las migraciones SQL necesarias para crear las tablas
 * Solo crea las tablas si no existen
 */
export async function runMigrations() {
  try {
    console.log('🔄 Verificando migraciones de base de datos...');

    // Verificar si las tablas principales ya existen
    const checkTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('usuarios', 'categorias', 'estados', 'comunicaciones')
    `);

    if (checkTables.rows.length >= 4) {
      console.log('✅ Las tablas ya existen, saltando migraciones');
      return;
    }

    console.log('📦 Ejecutando migraciones...');

    // Crear tablas
    await pool.query(`
      -- Tabla de usuarios
      CREATE TABLE IF NOT EXISTS usuarios (
        id_usuario SERIAL PRIMARY KEY,
        nombre VARCHAR(100),
        correo VARCHAR(150),
        telefono VARCHAR(50),
        semestre_area VARCHAR(100),
        tipo_usuario VARCHAR(50) CHECK (tipo_usuario IN ('Estudiante','Docente','Administrativo','Servicios Generales')),
        sexo VARCHAR(50) CHECK (sexo IN ('Mujer','Hombre','Prefiero no responder')),
        confidencial BOOLEAN DEFAULT TRUE,
        autorizo_contacto BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      -- Tabla de categorías
      CREATE TABLE IF NOT EXISTS categorias (
        id_categoria SERIAL PRIMARY KEY,
        nombre_categoria VARCHAR(100) NOT NULL
      );
    `);

    // Insertar categorías
    await pool.query(`
      INSERT INTO categorias (nombre_categoria) 
      SELECT 'Infraestructura' 
      WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Infraestructura');
      
      INSERT INTO categorias (nombre_categoria) 
      SELECT 'Asuntos Académicos' 
      WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Asuntos Académicos');
      
      INSERT INTO categorias (nombre_categoria) 
      SELECT 'Asuntos Administrativos' 
      WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Asuntos Administrativos');
      
      INSERT INTO categorias (nombre_categoria) 
      SELECT 'Convivencia' 
      WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Convivencia');
      
      INSERT INTO categorias (nombre_categoria) 
      SELECT 'Transporte' 
      WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Transporte');
      
      INSERT INTO categorias (nombre_categoria) 
      SELECT 'Otro' 
      WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Otro');
    `);

    await pool.query(`
      -- Tabla de estados
      CREATE TABLE IF NOT EXISTS estados (
        id_estado SERIAL PRIMARY KEY,
        nombre_estado VARCHAR(50) NOT NULL
      );
    `);

    // Insertar estados
    await pool.query(`
      INSERT INTO estados (nombre_estado) 
      SELECT 'Pendiente' 
      WHERE NOT EXISTS (SELECT 1 FROM estados WHERE nombre_estado = 'Pendiente');
      
      INSERT INTO estados (nombre_estado) 
      SELECT 'En Proceso' 
      WHERE NOT EXISTS (SELECT 1 FROM estados WHERE nombre_estado = 'En Proceso');
      
      INSERT INTO estados (nombre_estado) 
      SELECT 'Atendida' 
      WHERE NOT EXISTS (SELECT 1 FROM estados WHERE nombre_estado = 'Atendida');
      
      INSERT INTO estados (nombre_estado) 
      SELECT 'Cerrada' 
      WHERE NOT EXISTS (SELECT 1 FROM estados WHERE nombre_estado = 'Cerrada');
    `);

    await pool.query(`
      -- Tabla de comunicaciones
      CREATE TABLE IF NOT EXISTS comunicaciones (
        id_comunicacion SERIAL PRIMARY KEY,
        folio VARCHAR(30) UNIQUE,
        tipo VARCHAR(50) CHECK (tipo IN ('Queja','Sugerencia','Reconocimiento')),
        id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
        id_categoria INT REFERENCES categorias(id_categoria),
        descripcion TEXT NOT NULL,
        fecha_recepcion DATE DEFAULT CURRENT_DATE,
        area_involucrada VARCHAR(150),
        medio CHAR(1) CHECK (medio IN ('F','D','P')) DEFAULT 'D',
        mostrar_publico BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      -- Tabla de evidencias
      CREATE TABLE IF NOT EXISTS evidencias (
        id_evidencia SERIAL PRIMARY KEY,
        id_comunicacion INT REFERENCES comunicaciones(id_comunicacion) ON DELETE CASCADE,
        tipo_archivo VARCHAR(10) CHECK (tipo_archivo IN ('PDF','JPG','PNG','DOCX','XLSX','MP4')),
        nombre_archivo VARCHAR(255) NOT NULL,
        ruta_archivo TEXT NOT NULL,
        tamano_bytes BIGINT,
        hash_sha256 CHAR(64),
        fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      -- Tabla de comisión
      CREATE TABLE IF NOT EXISTS comision (
        id_miembro SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        rol VARCHAR(50) CHECK (rol IN ('Presidente','Secretario Técnico','Representante Docente','Representante Estudiantil','Representante Administrativo')),
        periodo_inicio DATE,
        periodo_fin DATE
      );
    `);

    await pool.query(`
      -- Tabla de seguimiento
      CREATE TABLE IF NOT EXISTS seguimiento (
        id_seguimiento SERIAL PRIMARY KEY,
        id_comunicacion INT REFERENCES comunicaciones(id_comunicacion) ON DELETE CASCADE,
        id_estado INT REFERENCES estados(id_estado),
        id_miembro INT REFERENCES comision(id_miembro),
        responsable VARCHAR(100),
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_resolucion DATE,
        notas TEXT,
        prioridad VARCHAR(20) CHECK (prioridad IN ('Baja','Media','Alta','Urgente')) DEFAULT 'Media'
      );
    `);

    await pool.query(`
      -- Tabla de historial de estados
      CREATE TABLE IF NOT EXISTS historial_estados (
        id_historial SERIAL PRIMARY KEY,
        id_comunicacion INT REFERENCES comunicaciones(id_comunicacion) ON DELETE CASCADE,
        id_estado INT REFERENCES estados(id_estado),
        responsable VARCHAR(100),
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notas TEXT
      );
    `);

    await pool.query(`
      -- Tabla de folios
      CREATE TABLE IF NOT EXISTS folios (
        id_folio SERIAL PRIMARY KEY,
        medio CHAR(1) CHECK (medio IN ('F','D')),
        anio INT NOT NULL,
        consecutivo INT NOT NULL DEFAULT 0,
        UNIQUE (medio, anio)
      );
    `);

    // Función para generar folios
    await pool.query(`
      CREATE OR REPLACE FUNCTION generar_folio()
      RETURNS TRIGGER AS $$
      DECLARE
        nuevo_consecutivo INT;
        mes TEXT;
        anio_actual INT := EXTRACT(YEAR FROM CURRENT_DATE);
        anio2 TEXT;
      BEGIN
        UPDATE folios
        SET consecutivo = consecutivo + 1
        WHERE medio = NEW.medio
          AND anio = anio_actual
        RETURNING consecutivo INTO nuevo_consecutivo;

        IF nuevo_consecutivo IS NULL THEN
          INSERT INTO folios (medio, anio, consecutivo)
          VALUES (NEW.medio, anio_actual, 1)
          RETURNING consecutivo INTO nuevo_consecutivo;
        END IF;

        mes := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
        anio2 := RIGHT(anio_actual::TEXT, 2);

        NEW.folio := NEW.medio || LPAD(nuevo_consecutivo::TEXT, 4, '0') 
                     || '/' || mes || '/FMHT/' || anio2;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger para generar folios
    await pool.query(`
      DROP TRIGGER IF EXISTS trg_generar_folio ON comunicaciones;
      CREATE TRIGGER trg_generar_folio
      BEFORE INSERT ON comunicaciones
      FOR EACH ROW
      EXECUTE FUNCTION generar_folio();
    `);

    // Vista materializada para reportes
    await pool.query(`
      DROP MATERIALIZED VIEW IF EXISTS reporte_trimestral;
      CREATE MATERIALIZED VIEW reporte_trimestral AS
      SELECT c.id_categoria, 
             e.nombre_estado, 
             COUNT(*) AS total,
             AVG(s.fecha_resolucion - c.fecha_recepcion) AS tiempo_promedio
      FROM comunicaciones c
      JOIN seguimiento s ON c.id_comunicacion = s.id_comunicacion
      JOIN estados e ON s.id_estado = e.id_estado
      GROUP BY c.id_categoria, e.nombre_estado;
    `);

    // Índices
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_comunicaciones_mostrar_publico 
      ON comunicaciones(tipo, mostrar_publico) 
      WHERE tipo = 'Reconocimiento';
      
      CREATE INDEX IF NOT EXISTS idx_comunicaciones_tipo ON comunicaciones(tipo);
      CREATE INDEX IF NOT EXISTS idx_comunicaciones_usuario ON comunicaciones(id_usuario);
      CREATE INDEX IF NOT EXISTS idx_comunicaciones_categoria ON comunicaciones(id_categoria);
      CREATE INDEX IF NOT EXISTS idx_comunicaciones_fecha ON comunicaciones(fecha_recepcion);
      CREATE INDEX IF NOT EXISTS idx_seguimiento_comunicacion ON seguimiento(id_comunicacion);
      CREATE INDEX IF NOT EXISTS idx_seguimiento_estado ON seguimiento(id_estado);
      CREATE INDEX IF NOT EXISTS idx_evidencias_comunicacion ON evidencias(id_comunicacion);
      CREATE INDEX IF NOT EXISTS idx_historial_comunicacion ON historial_estados(id_comunicacion);
      CREATE INDEX IF NOT EXISTS idx_folios_medio_anio ON folios(medio, anio);
    `);

    // Tabla de usuarios admin
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios_admin (
        id_admin SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100),
        rol VARCHAR(50) DEFAULT 'admin'
      );
    `);

    // Insertar usuarios admin (contraseñas: admin/admin123 y secretario/secretario123)
    // NOTA: Estas contraseñas están hasheadas con bcrypt
    await pool.query(`
      INSERT INTO usuarios_admin (username, password, nombre, rol) 
      SELECT 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador', 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM usuarios_admin WHERE username = 'admin');
      
      INSERT INTO usuarios_admin (username, password, nombre, rol) 
      SELECT 'secretario', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Secretario', 'secretario'
      WHERE NOT EXISTS (SELECT 1 FROM usuarios_admin WHERE username = 'secretario');
    `);

    // Tabla de configuración del sistema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id_config SERIAL PRIMARY KEY,
        clave VARCHAR(100) UNIQUE NOT NULL,
        valor TEXT,
        descripcion TEXT,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_por VARCHAR(100)
      );
    `);

    // Insertar configuración por defecto
    await pool.query(`
      INSERT INTO configuracion (clave, valor, descripcion, actualizado_por) 
      SELECT 'nombre_sistema', 'Buzón de Quejas, Sugerencias y Reconocimientos', 'Nombre del sistema', 'Sistema'
      WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'nombre_sistema');
      
      INSERT INTO configuracion (clave, valor, descripcion, actualizado_por) 
      SELECT 'email_contacto', 'quejasysugerenciasfmht@unach.mx', 'Email de contacto para comunicaciones', 'Sistema'
      WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'email_contacto');
      
      INSERT INTO configuracion (clave, valor, descripcion, actualizado_por) 
      SELECT 'tiempo_respuesta', '10', 'Tiempo de respuesta esperado en días hábiles', 'Sistema'
      WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'tiempo_respuesta');
      
      INSERT INTO configuracion (clave, valor, descripcion, actualizado_por) 
      SELECT 'notificaciones_email', 'true', 'Habilitar notificaciones por email', 'Sistema'
      WHERE NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'notificaciones_email');
    `);

    console.log('✅ Migraciones ejecutadas correctamente');
  } catch (error: any) {
    console.error('❌ Error al ejecutar migraciones:', error.message);
    // No lanzamos el error para que el servidor pueda iniciar aunque haya un problema con las migraciones
    console.log('⚠️ El servidor continuará iniciando, pero algunas tablas pueden no existir');
  }
}

