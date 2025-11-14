# Configuración Post-Despliegue

## Después de desplegar en Vercel

### Paso 1: Obtener la URL de Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Copia la URL de producción (ejemplo: `https://tu-proyecto.vercel.app`)

### Paso 2: Configurar CORS en Render

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Selecciona tu servicio backend: `buzon-unach-backend`
3. Ve a la pestaña **"Environment"** (Variables de Entorno)
4. Busca la variable `FRONTEND_URL` o haz clic en **"Add Environment Variable"**
5. Configura:
   - **Key:** `FRONTEND_URL`
   - **Value:** `https://tu-proyecto.vercel.app` (tu URL de Vercel)
6. Haz clic en **"Save Changes"**
7. Render reiniciará automáticamente el servicio (toma 1-2 minutos)

### Paso 3: Verificar que Funciona

1. Abre la URL de Vercel en tu navegador
2. Abre la consola del navegador (F12)
3. Verifica que veas:
   ```
   🔧 API_BASE_URL configurada: https://buzon-unach-backend.onrender.com
   ```
4. Prueba:
   - ✅ Navegar por la aplicación
   - ✅ Enviar un formulario
   - ✅ Hacer login de usuario
   - ✅ Hacer login de admin

### Si tienes múltiples URLs (desarrollo + producción)

Puedes configurar múltiples URLs separadas por comas:

```
FRONTEND_URL = https://tu-proyecto.vercel.app,https://www.tu-dominio.com
```

### Variables de Entorno en Render (Resumen)

Asegúrate de tener estas variables configuradas en Render:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Entorno de producción |
| `DATABASE_URL` | (automático) | URL de la base de datos de Render |
| `FRONTEND_URL` | `https://tu-proyecto.vercel.app` | URL del frontend en Vercel |
| `CLOUDINARY_CLOUD_NAME` | (opcional) | Si usas Cloudinary |
| `CLOUDINARY_API_KEY` | (opcional) | Si usas Cloudinary |
| `CLOUDINARY_API_SECRET` | (opcional) | Si usas Cloudinary |

### Variables de Entorno en Vercel

Asegúrate de tener esta variable en Vercel:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_API_URL` | `https://buzon-unach-backend.onrender.com` | URL del backend en Render |

### Solución de Problemas

#### Error: "CORS: Origen no permitido"
- Verifica que `FRONTEND_URL` esté configurada correctamente en Render
- Asegúrate de que la URL no tenga barra final (`/`)
- Espera 1-2 minutos después de guardar para que Render reinicie

#### Error: "Cannot connect to API"
- Verifica que el backend en Render esté funcionando (verifica los logs)
- Verifica que `VITE_API_URL` esté configurada en Vercel
- Verifica la consola del navegador para ver la URL que está usando

#### La aplicación carga pero no se conecta
- Abre la consola del navegador (F12)
- Verifica que `API_BASE_URL` apunte a Render
- Verifica que no haya errores de CORS en la consola

### Verificación Final

Después de configurar todo, deberías poder:

1. ✅ Acceder a la aplicación desde Vercel
2. ✅ Enviar formularios sin errores
3. ✅ Hacer login sin problemas
4. ✅ Ver datos del backend correctamente
5. ✅ No ver errores de CORS en la consola

¡Listo! Tu aplicación debería estar funcionando completamente en producción.

