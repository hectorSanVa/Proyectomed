# API WebUnach – Buzón de Sugerencias

API REST para gestionar usuarios, categorías, estados, comunicaciones, evidencias, seguimientos, comisión, historial de estados y folios automáticos en la plataforma del Buzón de Sugerencias de WebUnach.

---

## 🔹 Tecnologías

- Node.js + TypeScript
- Express
- PostgreSQL
- pg (node-postgres)
- dotenv
- cors, helmet, morgan

---

## 🔹 Requisitos

- Node.js >= 18
- PostgreSQL
- npm o yarn

---

## 🔹 Instalación

1. Clonar el repositorio:
```bash
git clone <URL_DEL_REPOSITORIO>
cd Backend WebUnach
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno en `.env`:

```bash
cp .env.example .env
```

Completa los valores según tu entorno:

```env
PORT=3000
NODE_ENV=development

DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=5432
DB_NAME=buzon_sugerencias
```

4. Levantar la API:
```bash
npm run dev   # Usando nodemon + ts-node
```

---

## 🔹 Estructura del proyecto

```
src/
├── config/       # Configuración de base de datos
├── models/       # Modelos TypeScript
├── dao/          # Acceso a datos
├── services/     # Lógica de negocio
├── controllers/  # Controladores
├── routes/       # Rutas Express
├── middlewares/  # Middlewares
├── utils/        # Helpers
└── app.ts        # Punto de entrada
```

---

## 🔹 Endpoints disponibles

### Usuarios

| Método | Ruta           | Descripción                |
| ------ | -------------- | -------------------------- |
| GET    | /usuarios      | Obtener todos los usuarios |
| GET    | /usuarios/:id  | Obtener usuario por ID     |
| POST   | /usuarios      | Crear nuevo usuario        |
| PUT    | /usuarios/:id  | Actualizar usuario         |
| DELETE | /usuarios/:id  | Eliminar usuario           |

**Ejemplo POST /usuarios**

```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@example.com",
  "telefono": "1234567890",
  "semestre_area": "4° Semestre - Informática",
  "tipo_usuario": "Estudiante",
  "sexo": "Hombre",
  "confidencial": true,
  "autorizo_contacto": false
}
```

---

### Categorías

| Método | Ruta             | Descripción                  |
| ------ | ---------------- | ---------------------------- |
| GET    | /categorias      | Obtener todas las categorías |
| GET    | /categorias/:id  | Obtener categoría por ID     |
| POST   | /categorias      | Crear nueva categoría        |
| PUT    | /categorias/:id  | Actualizar categoría         |
| DELETE | /categorias/:id  | Eliminar categoría           |

**Ejemplo POST /categorias**

```json
{
  "nombre_categoria": "Infraestructura"
}
```

---

### Estados

| Método | Ruta          | Descripción               |
| ------ | ------------- | ------------------------- |
| GET    | /estados      | Obtener todos los estados |
| GET    | /estados/:id  | Obtener estado por ID     |
| POST   | /estados      | Crear nuevo estado        |
| PUT    | /estados/:id  | Actualizar estado         |
| DELETE | /estados/:id  | Eliminar estado           |

**Ejemplo POST /estados**

```json
{
  "nombre_estado": "Pendiente"
}
```

---

### Comunicaciones

| Método | Ruta                 | Descripción                      |
| ------ | -------------------- | -------------------------------- |
| GET    | /comunicaciones      | Obtener todas las comunicaciones |
| GET    | /comunicaciones/:id  | Obtener comunicación por ID      |
| POST   | /comunicaciones      | Crear nueva comunicación         |
| PUT    | /comunicaciones/:id  | Actualizar comunicación          |
| DELETE | /comunicaciones/:id  | Eliminar comunicación            |

**Nota importante:**  
El folio ahora se genera automáticamente en la base de datos mediante trigger. No es necesario enviarlo en el POST.

**Ejemplo POST /comunicaciones**

```json
{
  "tipo": "Queja",
  "id_usuario": 1,
  "id_categoria": 2,
  "descripcion": "El aula 101 no tiene proyector",
  "area_involucrada": "Recursos Materiales"
}
```

**Respuesta con folio generado:**

```json
{
  "id_comunicacion": 5,
  "folio": "D0001/08/FMHT/25",
  "tipo": "Queja",
  "id_usuario": 1,
  "id_categoria": 2,
  "descripcion": "El aula 101 no tiene proyector",
  "area_involucrada": "Recursos Materiales",
  "fecha_recepcion": "2025-08-28"
}
```

---

### Evidencias

| Método | Ruta             | Descripción                  |
| ------ | ---------------- | ---------------------------- |
| GET    | /evidencias      | Obtener todas las evidencias |
| GET    | /evidencias/:id  | Obtener evidencia por ID     |
| POST   | /evidencias      | Crear nueva evidencia        |
| PUT    | /evidencias/:id  | Actualizar evidencia         |
| DELETE | /evidencias/:id  | Eliminar evidencia           |

**Ejemplo POST /evidencias**

```json
{
  "id_comunicacion": 1,
  "tipo_archivo": "PDF",
  "nombre_archivo": "reporte.pdf",
  "ruta_archivo": "/uploads/reporte.pdf",
  "tamano_bytes": 204800,
  "hash_sha256": "a1b2c3d4e5f6..."
}
```

---

### Seguimientos

| Método | Ruta               | Descripción                    |
| ------ | ------------------ | ------------------------------ |
| GET    | /seguimientos      | Obtener todos los seguimientos |
| GET    | /seguimientos/:id  | Obtener seguimiento por ID     |
| POST   | /seguimientos      | Crear nuevo seguimiento        |
| PUT    | /seguimientos/:id  | Actualizar seguimiento         |
| DELETE | /seguimientos/:id  | Eliminar seguimiento           |

**Ejemplo POST /seguimientos**

```json
{
  "id_comunicacion": 1,
  "id_estado": 2,
  "id_miembro": 1,
  "responsable": "Mtro. García",
  "notas": "Se asignó al área de mantenimiento"
}
```

---

### Historial de Estados

| Método | Ruta                   | Descripción                      |
| ------ | ---------------------- | -------------------------------- |
| GET    | /historial-estados      | Obtener todos los registros      |
| GET    | /historial-estados/:id  | Obtener registro por ID          |
| POST   | /historial-estados      | Crear nuevo registro             |
| DELETE | /historial-estados/:id  | Eliminar registro                |

**Ejemplo POST /historial-estados**

```json
{
  "id_comunicacion": 1,
  "id_estado": 3,
  "responsable": "Mtro. García",
  "notas": "Se completó la atención"
}
```

---

### Comisión

| Método | Ruta             | Descripción                               |
| ------ | ---------------- | ----------------------------------------- |
| GET    | /comisiones      | Obtener todos los miembros de la comisión |
| GET    | /comisiones/:id  | Obtener miembro por ID                    |
| POST   | /comisiones      | Crear nuevo miembro                       |
| PUT    | /comisiones/:id  | Actualizar miembro                        |
| DELETE | /comisiones/:id  | Eliminar miembro                          |

**Ejemplo POST /comisiones**

```json
{
  "nombre": "Lic. Ana López",
  "rol": "Presidente",
  "periodo_inicio": "2025-08-01",
  "periodo_fin": "2026-07-31"
}
```

---

### Folios

| Método | Ruta                  | Descripción                     |
| ------ | -------------------- | ------------------------------- |
| GET    | /folios              | Obtener todos los folios        |
| GET    | /folios/:medio/:anio | Obtener folio por medio y año   |

**Ejemplo GET /folios/D/2025**

```json
{
  "id_folio": 1,
  "medio": "D",
  "anio": 2025,
  "consecutivo": 1
}
```

---

### Reportes

| Método | Ruta                     | Descripción                     |
| ------ | ------------------------ | ------------------------------- |
| GET    | /reportes/trimestral     | Obtener reporte trimestral      |

**Ejemplo GET /reportes/trimestral**

```json
[
  {
    "id_categoria": 1,
    "nombre_estado": "Pendiente",
    "total": 5,
    "tiempo_promedio": 2.4
  }
]
```

---

## 🔹 Pruebas

Puedes usar **Postman** o **Insomnia**:

- URL base: `http://localhost:3000`
- Headers: `Content-Type: application/json`
- Body: JSON según el endpoint

---

## 🔹 Notas importantes

- Asegúrate que PostgreSQL esté corriendo y la base `buzon_sugerencias` exista.
- La API usa `dotenv`; **no subas tu `.env` a repositorios públicos**.
- Todos los endpoints retornan JSON.
- Los folios se generan automáticamente, no enviar `folio` al crear comunicaciones.

---

## 🔹 Autor

- Creado por Marvin Avila  
- WebUnach – Agosto 2025


Este README ya cubre:

✅ Instalación  
✅ Configuración de `.env`  
✅ Estructura del proyecto  
✅ Todos los endpoints con ejemplos JSON  
✅ Notas y recomendaciones para pruebas  

