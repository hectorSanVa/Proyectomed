-- Migración para agregar soporte de Cloudinary a la tabla evidencias
-- Esta migración agrega columnas opcionales para almacenar URLs y public IDs de Cloudinary

-- Agregar columna cloudinary_url (opcional)
ALTER TABLE evidencias 
ADD COLUMN IF NOT EXISTS cloudinary_url TEXT;

-- Agregar columna cloudinary_public_id (opcional, para eliminación)
ALTER TABLE evidencias 
ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255);

-- Crear índice para búsquedas por public_id (útil para eliminación)
CREATE INDEX IF NOT EXISTS idx_evidencias_cloudinary_public_id 
ON evidencias(cloudinary_public_id) 
WHERE cloudinary_public_id IS NOT NULL;

-- Comentarios en las columnas
COMMENT ON COLUMN evidencias.cloudinary_url IS 'URL de Cloudinary donde está almacenado el archivo';
COMMENT ON COLUMN evidencias.cloudinary_public_id IS 'Public ID de Cloudinary para eliminación del archivo';

