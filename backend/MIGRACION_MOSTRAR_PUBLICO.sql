-- Script de migración para agregar el campo 'mostrar_publico' a la tabla comunicaciones
-- Este campo permite al administrador decidir qué reconocimientos mostrar en la página pública

-- Agregar columna mostrar_publico si no existe
ALTER TABLE comunicaciones 
ADD COLUMN IF NOT EXISTS mostrar_publico BOOLEAN DEFAULT FALSE;

-- Actualizar registros existentes: solo los reconocimientos con estado "Atendida" o "Cerrada" se marcan como públicos por defecto
UPDATE comunicaciones 
SET mostrar_publico = TRUE 
WHERE tipo = 'Reconocimiento' 
  AND id_comunicacion IN (
    SELECT c.id_comunicacion 
    FROM comunicaciones c
    INNER JOIN seguimiento s ON c.id_comunicacion = s.id_comunicacion
    INNER JOIN estados e ON s.id_estado = e.id_estado
    WHERE e.nombre_estado IN ('Atendida', 'Cerrada')
  );

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_comunicaciones_mostrar_publico 
ON comunicaciones(tipo, mostrar_publico) 
WHERE tipo = 'Reconocimiento';



