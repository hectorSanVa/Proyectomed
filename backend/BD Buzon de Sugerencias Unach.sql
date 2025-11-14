-- =========================
-- CREACIÓN DE BASE DE DATOS
-- =========================
CREATE DATABASE buzon_sugerencias WITH ENCODING 'UTF8' LC_COLLATE='es_MX.UTF-8' LC_CTYPE='es_MX.UTF-8';
\c buzon_sugerencias;

-- Configurar codificación UTF-8 para la sesión
SET client_encoding = 'UTF8';

-- =========================
-- TABLA DE USUARIOS
-- =========================
CREATE TABLE usuarios (
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
CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL
);

INSERT INTO categorias (nombre_categoria) VALUES
('Infraestructura'),
('Asuntos Académicos'),
('Asuntos Administrativos'),
('Convivencia'),
('Transporte'),
('Otro');

-- =========================
-- TABLA DE ESTADOS
-- =========================
CREATE TABLE estados (
    id_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(50) NOT NULL
);

INSERT INTO estados (nombre_estado) VALUES
('Pendiente'),
('En Proceso'),
('Atendida'),
('Cerrada');

-- =========================
-- TABLA DE COMUNICACIONES
-- =========================
CREATE TABLE comunicaciones (
    id_comunicacion SERIAL PRIMARY KEY,
    folio VARCHAR(30) UNIQUE NOT NULL,
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
CREATE TABLE evidencias (
    id_evidencia SERIAL PRIMARY KEY,
    id_comunicacion INT REFERENCES comunicaciones(id_comunicacion) ON DELETE CASCADE,
    tipo_archivo VARCHAR(10) CHECK (tipo_archivo IN ('PDF','JPG','PNG','DOCX','XLSX','MP4')),
    nombre_archivo VARCHAR(255) NOT NULL,
    ruta_archivo TEXT NOT NULL,
    tamano_bytes BIGINT,
    hash_sha256 CHAR(64),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cloudinary_url TEXT,
    cloudinary_public_id VARCHAR(255)
);

-- Índice para búsquedas por public_id de Cloudinary
CREATE INDEX IF NOT EXISTS idx_evidencias_cloudinary_public_id 
ON evidencias(cloudinary_public_id) 
WHERE cloudinary_public_id IS NOT NULL;

-- =========================
-- TABLA DE COMISIÓN
-- =========================
CREATE TABLE comision (
    id_miembro SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50) CHECK (rol IN ('Presidente','Secretario Técnico','Representante Docente','Representante Estudiantil','Representante Administrativo')),
    periodo_inicio DATE,
    periodo_fin DATE
);

-- =========================
-- TABLA DE SEGUIMIENTO
-- =========================
CREATE TABLE seguimiento (
    id_seguimiento SERIAL PRIMARY KEY,
    id_comunicacion INT REFERENCES comunicaciones(id_comunicacion) ON DELETE CASCADE,
    id_estado INT REFERENCES estados(id_estado),
    id_miembro INT REFERENCES comision (id_miembro),
    responsable VARCHAR(100),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion DATE,
    notas TEXT,
    prioridad VARCHAR(20) CHECK (prioridad IN ('Baja','Media','Alta','Urgente')) DEFAULT 'Media'
);


-- =========================
--     tablas nuevas
-- =========================

CREATE TABLE historial_estados (
    id_historial SERIAL PRIMARY KEY,
    id_comunicacion INT REFERENCES comunicaciones(id_comunicacion) ON DELETE CASCADE,
    id_estado INT REFERENCES estados(id_estado),
    responsable VARCHAR(100),
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notas TEXT
);


-- ========================
--     Tabla de Folios
-- ========================

CREATE TABLE folios (
    id_folio SERIAL PRIMARY KEY,
    medio CHAR(1) CHECK (medio IN ('F','D')),  -- F=Físico, D=Digital
    anio INT NOT NULL,
    consecutivo INT NOT NULL DEFAULT 0,
    UNIQUE (medio, anio)  -- asegura que solo haya un contador por año y medio
);

-- ====================================
-- Trigeer para la generacion de Folios 
-- ====================================

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

-- Trigger
DROP TRIGGER IF EXISTS trg_generar_folio ON comunicaciones;
CREATE TRIGGER trg_generar_folio
BEFORE INSERT ON comunicaciones
FOR EACH ROW
EXECUTE FUNCTION generar_folio();



-- =================
--     Reportes
-- =================

CREATE MATERIALIZED VIEW reporte_trimestral AS
SELECT c.id_categoria, 
       e.nombre_estado, 
       COUNT(*) AS total,
       AVG(s.fecha_resolucion - c.fecha_recepcion) AS tiempo_promedio
FROM comunicaciones c
JOIN seguimiento s ON c.id_comunicacion = s.id_comunicacion
JOIN estados e ON s.id_estado = e.id_estado
GROUP BY c.id_categoria, e.nombre_estado;

-- =================
--     Índices
-- =================

-- Índice para mejorar el rendimiento de consultas de reconocimientos públicos
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
-- TABLA DE USUARIOS ADMIN
-- =========================
CREATE TABLE usuarios_admin (
    id_admin SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100),
    rol VARCHAR(50) DEFAULT 'admin'
);

-- Insertar usuarios admin por defecto (contraseñas: admin/admin123 y secretario/secretario123)
-- NOTA: Las contraseñas están hasheadas con bcrypt
INSERT INTO usuarios_admin (username, password, nombre, rol) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador', 'admin'),
('secretario', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Secretario', 'secretario');

-- =========================
-- TABLA DE CONFIGURACIÓN DEL SISTEMA
-- =========================
CREATE TABLE configuracion (
    id_config SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_por VARCHAR(100)
);

-- Insertar configuración por defecto
INSERT INTO configuracion (clave, valor, descripcion, actualizado_por) VALUES
('nombre_sistema', 'Buzón de Quejas, Sugerencias y Reconocimientos', 'Nombre del sistema', 'Sistema'),
('email_contacto', 'quejasysugerenciasfmht@unach.mx', 'Email de contacto para comunicaciones', 'Sistema'),
('tiempo_respuesta', '10', 'Tiempo de respuesta esperado en días hábiles', 'Sistema'),
('notificaciones_email', 'true', 'Habilitar notificaciones por email', 'Sistema');

-- =========================
-- ACTUALIZAR TABLA DE SEGUIMIENTO
-- =========================
-- Cambiar fecha_actualizacion de DATE a TIMESTAMP para mejor precisión
ALTER TABLE seguimiento 
ALTER COLUMN fecha_actualizacion TYPE TIMESTAMP USING fecha_actualizacion::TIMESTAMP;

