-- Script de migración para agregar el campo 'medio' a la tabla comunicaciones
-- Ejecuta este script si tu base de datos ya existe y no tiene el campo 'medio'

-- Agregar columna medio si no existe
ALTER TABLE comunicaciones 
ADD COLUMN IF NOT EXISTS medio CHAR(1) CHECK (medio IN ('F','D')) DEFAULT 'D';

-- Actualizar registros existentes para que tengan 'D' (Digital) por defecto
UPDATE comunicaciones 
SET medio = 'D' 
WHERE medio IS NULL;



