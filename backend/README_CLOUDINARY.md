# Configuración de Cloudinary

Esta guía explica cómo configurar Cloudinary para el almacenamiento de archivos (evidencias) en el sistema.

## ¿Qué es Cloudinary?

Cloudinary es un servicio en la nube que proporciona almacenamiento de archivos, transformación de imágenes y videos, y entrega de contenido optimizado. Es ideal para aplicaciones web que necesitan manejar archivos multimedia.

## Ventajas de usar Cloudinary

1. **Almacenamiento persistente**: Los archivos se guardan en la nube, no en el servidor local
2. **Optimización automática**: Cloudinary optimiza automáticamente las imágenes
3. **CDN global**: Los archivos se sirven desde una red de distribución de contenido (CDN)
4. **Escalabilidad**: No hay límites de almacenamiento en el plan gratuito (con algunas restricciones)
5. **Transformaciones**: Puedes transformar imágenes y videos on-the-fly

## Configuración

### 1. Crear cuenta en Cloudinary

1. Ve a [https://cloudinary.com/](https://cloudinary.com/)
2. Crea una cuenta gratuita
3. Una vez registrado, ve al Dashboard
4. En la sección "Account Details", encontrarás:
   - **Cloud Name**: Tu nombre de nube
   - **API Key**: Tu clave de API
   - **API Secret**: Tu secreto de API

### 2. Configurar variables de entorno

#### Desarrollo local

1. Abre el archivo `backend/.env` (si no existe, crea uno basado en `env.example`)
2. Agrega las siguientes variables:

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

3. Reemplaza los valores con tus credenciales de Cloudinary

#### Producción (Render)

1. Ve a tu servicio en Render Dashboard
2. Ve a la sección "Environment"
3. Agrega las siguientes variables de entorno:
   - `CLOUDINARY_CLOUD_NAME`: Tu cloud name
   - `CLOUDINARY_API_KEY`: Tu API key
   - `CLOUDINARY_API_SECRET`: Tu API secret

### 3. Ejecutar migración de base de datos

Si ya tienes una base de datos en funcionamiento, necesitas agregar las columnas de Cloudinary:

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

O simplemente ejecuta el archivo de migración:

```bash
psql -d tu_base_de_datos -f backend/MIGRACION_CLOUDINARY.sql
```

## Funcionamiento

### Modo híbrido

El sistema funciona en modo híbrido:

- **Si Cloudinary está configurado**: Los archivos se suben a Cloudinary y se almacena la URL en la base de datos
- **Si Cloudinary NO está configurado**: Los archivos se guardan localmente en la carpeta `uploads/` (modo de desarrollo)

### Proceso de subida

1. El usuario sube un archivo desde el frontend
2. El archivo se recibe en el backend usando Multer
3. Si Cloudinary está configurado:
   - El archivo se sube a Cloudinary
   - Se obtiene la URL y el public_id
   - Se guarda en la base de datos
4. Si Cloudinary NO está configurado:
   - El archivo se guarda en la carpeta `uploads/`
   - Se guarda la ruta local en la base de datos

### Proceso de descarga

1. El usuario solicita descargar un archivo
2. Si el archivo está en Cloudinary:
   - Se redirige a la URL de Cloudinary
3. Si el archivo está localmente:
   - Se descarga desde el servidor

### Proceso de eliminación

1. El usuario elimina una evidencia
2. Si el archivo está en Cloudinary:
   - Se elimina de Cloudinary usando el public_id
3. Si el archivo está localmente:
   - Se elimina del sistema de archivos

## Límites del plan gratuito

El plan gratuito de Cloudinary incluye:

- **25 GB de almacenamiento**
- **25 GB de ancho de banda por mes**
- **25,000 transformaciones por mes**

Para la mayoría de aplicaciones pequeñas y medianas, esto es suficiente.

## Solución de problemas

### Error: "Cloudinary no está configurado"

- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que los valores no tengan espacios en blanco
- Reinicia el servidor después de cambiar las variables de entorno

### Error: "Invalid API Key"

- Verifica que la API Key y el API Secret sean correctos
- Asegúrate de copiar los valores exactamente como aparecen en el Dashboard de Cloudinary

### Archivos no se suben a Cloudinary

- Verifica los logs del servidor para ver errores específicos
- Asegúrate de que la cuenta de Cloudinary esté activa
- Verifica que no hayas excedido los límites del plan gratuito

### Los archivos antiguos no tienen URL de Cloudinary

- Los archivos subidos antes de configurar Cloudinary seguirán usando almacenamiento local
- Puedes migrarlos manualmente si es necesario
- Los nuevos archivos se subirán automáticamente a Cloudinary

## Migración de archivos existentes

Si tienes archivos almacenados localmente y quieres migrarlos a Cloudinary, puedes crear un script de migración que:

1. Lee todos los archivos de la carpeta `uploads/`
2. Los sube a Cloudinary
3. Actualiza la base de datos con las nuevas URLs

**Nota**: Este proceso puede tardar dependiendo de la cantidad de archivos.

## Recursos adicionales

- [Documentación de Cloudinary](https://cloudinary.com/documentation)
- [Node.js SDK de Cloudinary](https://cloudinary.com/documentation/node_integration)
- [Transformaciones de imágenes](https://cloudinary.com/documentation/image_transformations)

