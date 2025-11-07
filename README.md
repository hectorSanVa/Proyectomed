# Buzón de Quejas, Sugerencias y Reconocimientos UNACH

Sistema web completo para la gestión de quejas, sugerencias y reconocimientos de la **Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV** - Benemérita Universidad Autónoma de Chiapas.

## 📋 Descripción

Este sistema permite a la comunidad universitaria (estudiantes, docentes, personal administrativo) enviar de forma **completamente anónima** quejas, sugerencias y reconocimientos. El sistema garantiza total privacidad y confidencialidad, sin crear registros de usuarios para las comunicaciones.

## ✨ Características Principales

- ✅ **Totalmente Anónimo**: No se guarda información personal de los usuarios
- 📝 **Formulario Público**: Accesible sin necesidad de registro
- 🔍 **Consulta de Folio**: Seguimiento de comunicaciones mediante folio único
- 👥 **Panel de Administración**: Gestión completa de comunicaciones
- 📊 **Dashboard Interactivo**: Estadísticas y gráficos en tiempo real
- 📄 **Exportación de Reportes**: CSV, TXT y PDF
- 📎 **Sistema de Evidencias**: Subida y descarga de archivos adjuntos
- 🎯 **Gestión de Prioridades**: Asignación de prioridad (Baja, Media, Alta, Urgente)
- 🔄 **Historial de Estados**: Seguimiento completo del ciclo de vida de cada comunicación
- 📱 **Diseño Responsive**: Adaptado para móviles y tablets

## 🛠️ Tecnologías

### Frontend
- **React 19** con TypeScript
- **Vite** - Build tool
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **React Icons** - Iconografía
- **jsPDF** - Generación de PDFs

### Backend
- **Node.js** con TypeScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **Multer** - Manejo de archivos
- **JWT** - Autenticación

## 📁 Estructura del Proyecto

```
PracticasMedi/
├── frontend/          # Aplicación React
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Páginas de la aplicación
│   │   ├── services/     # Servicios API
│   │   ├── context/      # Context API
│   │   └── hooks/        # Custom hooks
│   └── package.json
├── backend/           # API Node.js
│   ├── src/
│   │   ├── controllers/  # Controladores
│   │   ├── services/     # Lógica de negocio
│   │   ├── dao/         # Data Access Objects
│   │   ├── models/      # Modelos de datos
│   │   ├── routes/      # Rutas API
│   │   └── middlewares/ # Middlewares
│   └── package.json
└── README.md
```

## 🚀 Instalación

### Prerrequisitos
- Node.js (v18 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### Backend

1. Navegar al directorio backend:
```bash
cd backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=buzon_unach
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu_secret_key
PORT=3000
```

4. Crear la base de datos:
```bash
# Ejecutar el script SQL
psql -U tu_usuario -d postgres -f "BD Buzon de Sugerencias Unach.sql"
```

5. Iniciar el servidor:
```bash
npm run dev
```

### Frontend

1. Navegar al directorio frontend:
```bash
cd frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar la URL de la API en `src/config/api.ts`:
```typescript
export const API_BASE_URL = 'http://localhost:3000';
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🔐 Credenciales por Defecto

### Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`

### Secretario
- **Usuario:** `secretario`
- **Contraseña:** `secretario123`

⚠️ **IMPORTANTE:** Cambiar estas contraseñas en producción.

## 📝 Funcionalidades

### Para Usuarios
- Envío anónimo de quejas, sugerencias y reconocimientos
- Consulta de estado mediante folio
- Seguimiento de comunicaciones enviadas
- Visualización de reconocimientos publicados

### Para Administradores
- Dashboard con estadísticas en tiempo real
- Gestión de quejas, sugerencias y reconocimientos
- Asignación de prioridades y estados
- Exportación de reportes (CSV, TXT, PDF)
- Descarga de formatos individuales en PDF
- Gestión de evidencias adjuntas

## 🎨 Colores UNACH

- **Azul Oscuro:** `#192d63`
- **Dorado:** `#d4b012`
- **Marrón:** `#735920`

## 📄 Licencia

Este proyecto es propiedad de la Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV - UNACH.

## 👥 Desarrollado por

Sistema desarrollado para la gestión del Buzón de Quejas, Sugerencias y Reconocimientos de la UNACH.

---

**Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV**  
**Benemérita Universidad Autónoma de Chiapas**

