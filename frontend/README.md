# Frontend - Buzón de Quejas y Sugerencias

Sistema web para la gestión de quejas, sugerencias y reconocimientos de la Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV - Benemérita Universidad Autónoma de Chiapas.

## Tecnologías

- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **React Icons** - Iconos

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` y configurar la URL de la API:
```
VITE_API_URL=http://localhost:3000
```

## Desarrollo

Ejecutar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Header.tsx      # Encabezado público
│   ├── Footer.tsx      # Pie de página
│   └── admin/          # Componentes del panel admin
├── pages/              # Páginas de la aplicación
│   ├── Inicio.tsx      # Página de inicio
│   ├── FormularioPublico.tsx  # Formulario público
│   ├── ConsultaFolio.tsx       # Consulta de folio
│   └── admin/         # Páginas del panel admin
├── services/           # Servicios para consumir API
├── config/             # Configuración (colores, API)
└── App.tsx             # Componente principal
```

## Build para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

## Colores UNACH

- Azul Oscuro: `#192d63`
- Dorado: `#d4b012`
- Marrón: `#735920`

## Sistema de Autenticación

El sistema incluye autenticación para el panel de administración.

### Credenciales por defecto:

- **Usuario:** `admin`
- **Contraseña:** `admin123`

O:

- **Usuario:** `secretario`
- **Contraseña:** `secretario123`

**⚠️ IMPORTANTE:** Cambiar estas contraseñas en producción.

### Rutas protegidas:

- `/admin` - Dashboard
- `/admin/quejas` - Gestión de Quejas
- `/admin/sugerencias` - Gestión de Sugerencias
- `/admin/reconocimientos` - Gestión de Reconocimientos
- `/admin/usuarios` - Gestión de Usuarios
- `/admin/reportes` - Reportes y Estadísticas

Las rutas protegidas redirigen automáticamente a `/login` si no hay sesión activa.

### Rutas públicas:

- `/` - Página de inicio
- `/formulario` - Formulario público
- `/consulta-folio` - Consulta de folio
- `/login` - Página de login

## Notas

- Asegúrate de que el backend esté corriendo en el puerto configurado
- El backend debe estar en `http://localhost:3000` por defecto
- Los colores y tipografía siguen la identidad visual de la UNACH
- El sistema de autenticación usa localStorage para mantener la sesión
