# Configuración de Cloudinary - Guía Rápida

## Credenciales de Cloudinary

Ya tienes las credenciales de Cloudinary. Configúralas así:

### Para Desarrollo Local (backend/.env)

Crea un archivo `.env` en la carpeta `backend/` con estas variables:

```env
CLOUDINARY_CLOUD_NAME=dakdyvfe4
CLOUDINARY_API_KEY=921646145742541
CLOUDINARY_API_SECRET=rDckTJTgMPKqq9TvVV_mcfRX0O4
```

**⚠️ IMPORTANTE:** El archivo `.env` NO se sube a GitHub (está en .gitignore) por seguridad.

### Para Producción (Render)

1. Ve a tu servicio en Render Dashboard
2. Ve a la sección "Environment"
3. Agrega estas variables de entorno:
   - `CLOUDINARY_CLOUD_NAME` = `dakdyvfe4`
   - `CLOUDINARY_API_KEY` = `921646145742541`
   - `CLOUDINARY_API_SECRET` = `rDckTJTgMPKqq9TvVV_mcfRX0O4`

## Ejecutar Migración de Base de Datos

Si ya tienes una base de datos en funcionamiento, ejecuta esta migración:

```sql
-- Ejecutar en tu base de datos PostgreSQL
ALTER TABLE evidencias 
ADD COLUMN IF NOT EXISTS cloudinary_url TEXT;

ALTER TABLE evidencias 
ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_evidencias_cloudinary_public_id 
ON evidencias(cloudinary_public_id) 
WHERE cloudinary_public_id IS NOT NULL;
```

O ejecuta el archivo completo:
```bash
psql -d tu_base_de_datos -f backend/MIGRACION_CLOUDINARY.sql
```

## Verificar que Funcione

1. **Desarrollo local:**
   - Crea el archivo `backend/.env` con las credenciales
   - Reinicia el servidor backend
   - Sube un archivo desde el formulario público
   - Verifica en los logs que aparezca: `✅ Archivo subido a Cloudinary`

2. **Producción (Render):**
   - Agrega las variables de entorno en Render
   - Reinicia el servicio
   - Los archivos nuevos se subirán automáticamente a Cloudinary

## Funcionamiento

- **Si Cloudinary está configurado**: Los archivos se suben a Cloudinary
- **Si Cloudinary NO está configurado**: Los archivos se guardan localmente en `uploads/`

## Próximos Pasos

1. ✅ Instalar dependencias: `npm install` (ya hecho)
2. ✅ Configurar variables de entorno (crear `.env` con las credenciales)
3. ✅ Ejecutar migración SQL (agregar columnas a la base de datos)
4. ✅ Reiniciar el servidor
5. ✅ Probar subiendo un archivo

## Solución de Problemas

### Error: "Cloudinary no está configurado"
- Verifica que las variables de entorno estén configuradas
- Reinicia el servidor después de cambiar las variables

### Error: "Invalid API Key"
- Verifica que copiaste las credenciales correctamente
- Asegúrate de no tener espacios en blanco al inicio o final

### Los archivos no se suben
- Revisa los logs del servidor para ver errores específicos
- Verifica que la cuenta de Cloudinary esté activa

