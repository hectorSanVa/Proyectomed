-- Script SQL para Render PostgreSQL
-- NOTA: La base de datos ya está creada en Render, solo creamos las tablas
-- NO ejecutar CREATE DATABASE ni \c

-- Configurar codificación UTF-8 para la sesión
SET client_encoding = 'UTF8';

-- =========================
-- TABLA DE USUARIOS
-- =========================
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

-- =========================
-- TABLA DE CATEGORÍAS
-- =========================
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL
);

-- Insertar categorías (evitar duplicados)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Infraestructura') THEN
        INSERT INTO categorias (nombre_categoria) VALUES ('Infraestructura');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Asuntos Académicos') THEN
        INSERT INTO categorias (nombre_categoria) VALUES ('Asuntos Académicos');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Asuntos Administrativos') THEN
        INSERT INTO categorias (nombre_categoria) VALUES ('Asuntos Administrativos');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Convivencia') THEN
        INSERT INTO categorias (nombre_categoria) VALUES ('Convivencia');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Transporte') THEN
        INSERT INTO categorias (nombre_categoria) VALUES ('Transporte');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM categorias WHERE nombre_categoria = 'Otro') THEN
        INSERT INTO categorias (nombre_categoria) VALUES ('Otro');
    END IF;
END $$;

-- =========================
-- TABLA DE ESTADOS
-- =========================
CREATE TABLE IF NOT EXISTS estados (
    id_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(50) NOT NULL
);

-- Insertar estados (evitar duplicados)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM estados WHERE nombre_estado = 'Pendiente') THEN
        INSERT INTO estados (nombre_estado) VALUES ('Pendiente');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM estados WHERE nombre_estado = 'En Proceso') THEN
        INSERT INTO estados (nombre_estado) VALUES ('En Proceso');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM estados WHERE nombre_estado = 'Atendida') THEN
        INSERT INTO estados (nombre_estado) VALUES ('Atendida');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM estados WHERE nombre_estado = 'Cerrada') THEN
        INSERT INTO estados (nombre_estado) VALUES ('Cerrada');
    END IF;
END $$;

-- =========================
-- TABLA DE COMUNICACIONES
-- =========================
CREATE TABLE IF NOT EXISTS comunicaciones (
    id_comunicacion SERIAL PRIMARY KEY,
    folio VARCHAR(30) UNIQUE,
    tipo VARCHAR(50) CHECK (tipo IN ('Queja','Sugerencia','Reconocimiento')),
    id_usuario INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    id_categoria INT REFERENCES categorias(id_categoria),
    descripcion TEXT NOT NULL,
    fecha_recepcion DATE DEFAULT CURRENT_DATE,
    area_involucrada VARCHAR(150),
    medio CHAR(1) CHECK (medio IN ('F','D')) DEFAULT 'D',
    mostrar_publico BOOLEAN DEFAULT FALSE
);

-- =========================
-- TABLA DE EVIDENCIAS
-- =========================
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

-- =========================
-- TABLA DE COMISIÓN
-- =========================
CREATE TABLE IF NOT EXISTS comision (
    id_miembro SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50) CHECK (rol IN ('Presidente','Secretario Técnico','Representante Docente','Representante Estudiantil','Representante Administrativo')),
    periodo_inicio DATE,
    periodo_fin DATE
);

-- =========================
-- TABLA DE SEGUIMIENTO
-- =========================
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

-- =========================
-- TABLA DE HISTORIAL DE ESTADOS
-- =========================
CREATE TABLE IF NOT EXISTS historial_estados (
    id_historial SERIAL PRIMARY KEY,
    id_comunicacion INT REFERENCES comunicaciones(id_comunicacion) ON DELETE CASCADE,
    id_estado INT REFERENCES estados(id_estado),
    responsable VARCHAR(100),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT
);

-- =========================
-- TABLA DE FOLIOS
-- =========================
CREATE TABLE IF NOT EXISTS folios (
    id_folio SERIAL PRIMARY KEY,
    medio CHAR(1) CHECK (medio IN ('F','D')),
    anio INT NOT NULL,
    consecutivo INT NOT NULL DEFAULT 0,
    UNIQUE (medio, anio)
);

-- =========================
-- FUNCIÓN Y TRIGGER PARA GENERAR FOLIOS
-- =========================
CREATE OR REPLACE FUNCTION generar_folio()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_consecutivo INT;
    mes TEXT;
    anio_actual INT := EXTRACT(YEAR FROM CURRENT_DATE);
    anio2 TEXT;
BEGIN
    -- Intentar incrementar el consecutivo del año actual
    UPDATE folios
    SET consecutivo = consecutivo + 1
    WHERE medio = NEW.medio
      AND anio = anio_actual
    RETURNING consecutivo INTO nuevo_consecutivo;

    -- Si no existe registro para el año actual, creamos uno
    IF nuevo_consecutivo IS NULL THEN
        INSERT INTO folios (medio, anio, consecutivo)
        VALUES (NEW.medio, anio_actual, 1)
        RETURNING consecutivo INTO nuevo_consecutivo;
    END IF;

    -- Construcción del folio oficial
    mes := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0');
    anio2 := RIGHT(anio_actual::TEXT, 2);

    NEW.folio := NEW.medio || LPAD(nuevo_consecutivo::TEXT, 4, '0') 
                 || '/' || mes || '/FMHT/' || anio2;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger solo si no existe
DROP TRIGGER IF EXISTS trg_generar_folio ON comunicaciones;
CREATE TRIGGER trg_generar_folio
BEFORE INSERT ON comunicaciones
FOR EACH ROW
EXECUTE FUNCTION generar_folio();

-- =========================
-- VISTA MATERIALIZADA PARA REPORTES
-- =========================
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

-- =========================
-- ÍNDICES PARA MEJORAR PERFORMANCE
-- =========================
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

-- =========================
-- TABLA DE USUARIOS ADMIN (para autenticación)
-- =========================
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id_admin SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    rol VARCHAR(50) DEFAULT 'admin'
);

-- Insertar usuarios admin por defecto (contraseñas: admin/admin123 y secretario/secretario123)
-- NOTA: Las contraseñas están hasheadas con bcrypt
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuarios_admin WHERE username = 'admin') THEN
        INSERT INTO usuarios_admin (username, password, nombre, rol) 
        VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM usuarios_admin WHERE username = 'secretario') THEN
        INSERT INTO usuarios_admin (username, password, nombre, rol) 
        VALUES ('secretario', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Secretario', 'secretario');
    END IF;
END $$;

-- =========================
-- TABLA DE CONFIGURACIÓN DEL SISTEMA
-- =========================
CREATE TABLE IF NOT EXISTS configuracion (
    id_config SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_por VARCHAR(100)
);

-- Insertar configuración por defecto
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'nombre_sistema') THEN
        INSERT INTO configuracion (clave, valor, descripcion, actualizado_por) 
        VALUES ('nombre_sistema', 'Buzón de Quejas, Sugerencias y Reconocimientos', 'Nombre del sistema', 'Sistema');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'email_contacto') THEN
        INSERT INTO configuracion (clave, valor, descripcion, actualizado_por) 
        VALUES ('email_contacto', 'quejasysugerenciasfmht@unach.mx', 'Email de contacto para comunicaciones', 'Sistema');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'tiempo_respuesta') THEN
        INSERT INTO configuracion (clave, valor, descripcion, actualizado_por) 
        VALUES ('tiempo_respuesta', '10', 'Tiempo de respuesta esperado en días hábiles', 'Sistema');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM configuracion WHERE clave = 'notificaciones_email') THEN
        INSERT INTO configuracion (clave, valor, descripcion, actualizado_por) 
        VALUES ('notificaciones_email', 'true', 'Habilitar notificaciones por email', 'Sistema');
    END IF;
END $$;

-- =========================
-- ACTUALIZAR TABLA DE SEGUIMIENTO
-- =========================
-- Cambiar fecha_actualizacion de DATE a TIMESTAMP para mejor precisión (solo si no está ya como TIMESTAMP)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'seguimiento' 
        AND column_name = 'fecha_actualizacion' 
        AND data_type = 'date'
    ) THEN
        ALTER TABLE seguimiento 
        ALTER COLUMN fecha_actualizacion TYPE TIMESTAMP USING fecha_actualizacion::TIMESTAMP;
    END IF;
END $$;

-- Mensaje de confirmación
SELECT 'Base de datos configurada correctamente en Render' AS mensaje;
