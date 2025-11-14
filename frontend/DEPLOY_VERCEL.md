# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar el frontend de tu aplicación en Vercel.

## Prerrequisitos

1. ✅ Cuenta en Vercel (gratuita): [https://vercel.com](https://vercel.com)
2. ✅ Código en GitHub (ya lo tienes)
3. ✅ Backend desplegado en Render (ya lo tienes)

## Paso 1: Crear Proyecto en Vercel

1. Ve a [https://vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"Add New..."** → **"Project"**
3. Conecta tu repositorio de GitHub si no lo has hecho
4. Selecciona el repositorio: `Proyectomed` (o el nombre que tengas)
5. Vercel detectará automáticamente que es un proyecto Vite/React

## Paso 2: Configurar el Proyecto

### Configuración del Build

Vercel debería detectar automáticamente:
- **Framework Preset:** Vite
- **Root Directory:** `frontend` (¡IMPORTANTE! Cambiar esto)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

**⚠️ IMPORTANTE:** Asegúrate de cambiar el **Root Directory** a `frontend` porque tu proyecto tiene la estructura:
```
/
├── backend/
└── frontend/  ← Este es el directorio del frontend
```

### Variables de Entorno

En la sección **"Environment Variables"**, agrega:

```
VITE_API_URL = https://buzon-unach-backend.onrender.com
```

**Nota:** Esta variable apunta al backend en Render.

## Paso 3: Desplegar

1. Haz clic en **"Deploy"**
2. Espera 2-3 minutos mientras Vercel:
   - Instala dependencias
   - Compila el proyecto
   - Despliega la aplicación
3. Una vez completado, verás una URL como: `https://tu-proyecto.vercel.app`

## Paso 4: Verificar el Despliegue

1. Abre la URL que te dio Vercel
2. Verifica que la aplicación cargue correctamente
3. Abre la consola del navegador (F12) y verifica:
   - `🔧 API_BASE_URL configurada: https://buzon-unach-backend.onrender.com`
   - No deberían aparecer errores de conexión

## Paso 5: Configurar Dominio Personalizado (Opcional)

Si tienes un dominio personalizado:

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio
3. Sigue las instrucciones para configurar los DNS

## Configuración de CORS en Render

Asegúrate de que en Render (backend) tengas configurada la variable de entorno:

```
FRONTEND_URL = https://tu-proyecto.vercel.app
```

O si tienes múltiples URLs:

```
FRONTEND_URL = https://tu-proyecto.vercel.app,https://www.tu-dominio.com
```

## Actualizaciones Automáticas

Una vez configurado, cada vez que hagas `git push` a la rama `main`:
- Vercel detectará los cambios automáticamente
- Recompilará y redesplegará la aplicación
- El proceso toma 2-3 minutos

## Solución de Problemas

### Error: "Build failed"
- Verifica que el **Root Directory** esté configurado como `frontend`
- Revisa los logs de build en Vercel para ver el error específico

### Error: "Cannot connect to API"
- Verifica que `VITE_API_URL` esté configurada en Vercel
- Verifica que el backend en Render esté funcionando
- Verifica que `FRONTEND_URL` esté configurada en Render

### Error: "404 Not Found" en rutas
- Verifica que `vercel.json` tenga la configuración de `rewrites`
- Esto asegura que todas las rutas redirijan a `index.html` (SPA)

### La aplicación carga pero no se conecta al backend
- Abre la consola del navegador (F12)
- Verifica que `API_BASE_URL` apunte a Render
- Si no, verifica la variable `VITE_API_URL` en Vercel

## Estructura de Archivos en Vercel

Vercel necesita saber que el frontend está en la carpeta `frontend/`:

```
tu-repositorio/
├── backend/          ← Backend (no se despliega en Vercel)
└── frontend/         ← Frontend (esto es lo que Vercel despliega)
    ├── package.json
    ├── vite.config.ts
    ├── src/
    └── ...
```

## Comandos de Build

Vercel ejecutará automáticamente:
```bash
cd frontend
npm install
npm run build
```

Los archivos compilados estarán en `frontend/dist/`

## Verificación Final

Después del despliegue, verifica:

1. ✅ La aplicación carga en la URL de Vercel
2. ✅ Puedes navegar entre páginas sin errores 404
3. ✅ El formulario público funciona
4. ✅ El login de admin funciona
5. ✅ Las peticiones al backend funcionan (revisa la consola)

## Soporte

Si tienes problemas:
- Revisa los logs de build en Vercel Dashboard
- Revisa los logs de runtime en Vercel Dashboard
- Verifica que todas las variables de entorno estén configuradas

