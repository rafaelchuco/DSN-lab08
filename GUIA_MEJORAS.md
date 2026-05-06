# 🚀 Guía de Implementación de Mejoras

Este documento describe las mejoras implementadas en el proyecto TechStore y cómo utilizarlas.

## ✅ Mejoras Implementadas

### 1. 🔐 Contador de Intentos MFA (Completado)

**Descripción:** Sistema de bloqueo temporal después de 3 intentos fallidos de código MFA.

**Características:**
- Máximo 3 intentos para ingresar código MFA
- Bloqueo temporal de 15 minutos después de 3 intentos fallidos
- Contador de intentos restantes en mensajes de error
- Auditoría de eventos de bloqueo MFA

**Campos agregados al modelo User:**
- `mfa_failed_attempts`: Contador de intentos fallidos
- `mfa_lock_until`: Fecha hasta la cual está bloqueado el MFA

**Uso:**
El sistema funciona automáticamente. Cuando un usuario ingresa un código MFA incorrecto:
1. Intento 1: "Código MFA inválido. 2 intentos restantes."
2. Intento 2: "Código MFA inválido. 1 intentos restantes."
3. Intento 3: "Demasiados intentos fallidos. Cuenta MFA bloqueada por 15 minutos."

---

### 2. 🗄️ Soporte para PostgreSQL (Completado)

**Descripción:** El sistema ahora soporta PostgreSQL además de SQLite.

**Configuración:**

#### Opción A: SQLite (Desarrollo - Por defecto)
```bash
# .env
DB_DIALECT=sqlite
SQLITE_STORAGE=database.sqlite
```

#### Opción B: PostgreSQL (Producción)
```bash
# .env
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techstore
DB_USER=techstore_user
DB_PASSWORD=techstore_pass
```

**Docker Compose:**
```bash
# Iniciar PostgreSQL + Backend con Docker
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

**Instalación de dependencias:**
```bash
cd /Users/rafael/projects/DSN-lab08
npm install
```

---

### 3. 📚 Documentación Swagger/OpenAPI (Completado)

**Descripción:** Documentación interactiva de la API con Swagger UI.

**Acceso:**
```
http://localhost:4000/api-docs
```

**Características:**
- Documentación completa de todos los endpoints
- Interfaz interactiva para probar la API
- Ejemplos de request/response
- Esquemas de datos (User, Product, Role)
- Documentación detallada de políticas RBAC y ABAC

**Endpoints documentados:**
- **Authentication:** `/api/auth/*` (register, login, mfa)
- **Users:** `/api/users/*` (CRUD, assign roles)
- **Roles:** `/api/roles/*` (CRUD)
- **Products:** `/api/products/*` (CRUD con políticas ABAC)

**Probar la API:**
1. Ir a http://localhost:4000/api-docs
2. Click en "Authorize" (🔒)
3. Ingresar: `Bearer YOUR_JWT_TOKEN`
4. Probar cualquier endpoint

---

### 4. 🎨 Frontend Mejorado (Completado)

**Descripción:** Interfaz completamente renovada con nuevas páginas y navegación.

**Nuevos Componentes:**
- `Layout.jsx`: Layout principal con navbar
- `ProtectedRoute.jsx`: Control de acceso por roles

**Nuevas Páginas:**

#### 📊 Dashboard
- Estadísticas en tiempo real
- Productos totales, stock bajo, productos premium
- Productos por categoría
- Información de permisos por rol

**Acceso:** Todos los usuarios
**URL:** `http://localhost:5173/#dashboard`

#### 📦 Productos
- Lista de productos (scope por tienda para Gerente/Empleado)
- CRUD completo con validaciones ABAC
- Botones habilitados/deshabilitados según permisos

**Acceso:** Admin, Gerente, Empleado
**URL:** `http://localhost:5173/#products`

#### 👥 Usuarios (Solo Admin)
- Lista de todos los usuarios
- Crear nuevos usuarios
- Asignar roles a usuarios
- Activar/desactivar usuarios

**Acceso:** Solo Admin
**URL:** `http://localhost:5173/#users`

#### 🎭 Roles (Solo Admin)
- Lista de todos los roles
- Crear nuevos roles personalizados
- Editar roles existentes
- Eliminar roles (si no tienen usuarios asignados)

**Acceso:** Solo Admin
**URL:** `http://localhost:5173/#roles`

**Navegación:**
- Navbar superior con enlaces a todas las páginas
- Información del usuario y roles en navbar
- Botón de cerrar sesión

---

## 🚀 Cómo Ejecutar el Proyecto Completo

### Opción 1: Desarrollo Local (SQLite)

**Backend:**
```bash
cd /Users/rafael/projects/DSN-lab08

# Instalar dependencias
npm install

# Iniciar servidor (puerto 4000)
npm run dev
```

**Frontend:**
```bash
cd /Users/rafael/projects/DSN-lab08/client

# Instalar dependencias (si es necesario)
npm install

# Iniciar cliente (puerto 5173)
npm run dev
```

**Accesos:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Swagger UI: http://localhost:4000/api-docs

**Usuario inicial:**
- Email: `admin@techstore.com`
- Password: `Admin123!`

### Opción 2: Producción con Docker (PostgreSQL)

```bash
cd /Users/rafael/projects/DSN-lab08

# Construir e iniciar servicios
docker-compose up --build

# Acceder
# Backend: http://localhost:4000
# Swagger: http://localhost:4000/api-docs
```

---

## 🧪 Probar las Nuevas Características

### 1. Probar Contador de Intentos MFA

1. Habilitar MFA para un usuario:
   ```bash
   # Login como admin
   POST /api/auth/login
   
   # Habilitar MFA
   POST /api/auth/mfa/enable
   ```

2. Intentar login con códigos incorrectos 3 veces
3. Observar el bloqueo temporal de 15 minutos

### 2. Probar Dashboard

1. Login como cualquier usuario
2. Navegar a `#dashboard`
3. Observar estadísticas según tu rol

### 3. Probar Gestión de Usuarios (Admin)

1. Login como admin
2. Navegar a `#users`
3. Crear un nuevo usuario
4. Asignar rol "Gerente"
5. Verificar que aparece en la lista

### 4. Probar Swagger UI

1. Ir a http://localhost:4000/api-docs
2. Expandir sección "Authentication"
3. Probar endpoint POST `/api/auth/register`
4. Autorizar con JWT token
5. Probar endpoints protegidos

---

## 📊 Comparación: Antes vs Después

### Backend

| Característica | Antes | Después |
|----------------|-------|---------|
| MFA Intentos | Sin límite | Máximo 3 intentos + bloqueo |
| Base de Datos | Solo SQLite | SQLite + PostgreSQL |
| Documentación API | Solo README | Swagger UI interactivo |
| Docker | No | Docker Compose completo |

### Frontend

| Característica | Antes | Después |
|----------------|-------|---------|
| Páginas | 3 (Login, MFA, Products) | 6 (+ Dashboard, Users, Roles) |
| Navegación | Una sola página | Navbar con múltiples páginas |
| Layout | Sin estructura | Layout profesional con navbar |
| Dashboard | No | Estadísticas en tiempo real |
| Gestión Usuarios | No | CRUD completo (Admin) |
| Gestión Roles | No | CRUD completo (Admin) |
| Estilos | Básicos | Diseño profesional y responsive |

---

## 🔧 Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```bash
# Database
DB_DIALECT=sqlite  # o 'postgres'
SQLITE_STORAGE=database.sqlite

# PostgreSQL (si DB_DIALECT=postgres)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=techstore
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_change_me
JWT_EXPIRY=1h
JWT_MFA_TEMP_EXPIRY=300s

# Server
PORT=4000
NODE_ENV=development

# Admin inicial
ADMIN_EMAIL=admin@techstore.com
ADMIN_PASSWORD=Admin123!
```

---

## 📝 Próximos Pasos Recomendados

1. **Tests Automatizados**: Implementar suite de tests con Jest
2. **Página de Auditoría**: Visualizar logs de `audit_logs`
3. **Exportar Reportes**: PDF/Excel de productos y auditoría
4. **Notificaciones**: Email para MFA y eventos importantes
5. **Métricas Avanzadas**: Gráficos con Chart.js en Dashboard

---

## 🐛 Troubleshooting

**Error: "Cannot find module 'swagger-jsdoc'"**
```bash
npm install
```

**Error: "Connection refused" (PostgreSQL)**
```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps

# Reiniciar servicios
docker-compose restart
```

**Error: Frontend no carga páginas nuevas**
```bash
cd client
npm install
npm run dev
```

---

## 📞 Soporte

Para más información, revisar:
- `MEJORAS_FUTURAS.md` - Roadmap de mejoras adicionales
- `README.md` - Documentación original del proyecto
- Swagger UI - http://localhost:4000/api-docs

---

**Fecha de implementación:** 6 de mayo de 2026
**Estado:** ✅ Todas las mejoras completadas y funcionales
