# TechStore — Guía de Mejoras Implementadas

![Estado](https://img.shields.io/badge/Estado-Implementado-brightgreen?style=flat)

> Documentación de todas las mejoras que se implementaron sobre el esqueleto base del proyecto, explicando qué se agregó, cómo funciona y cómo probarlo.

---

## Tabla de Contenidos

1. [Resumen de Mejoras](#1-resumen-de-mejoras)
2. [Contador de Intentos MFA](#2-contador-de-intentos-mfa)
3. [Soporte PostgreSQL](#3-soporte-postgresql)
4. [Documentación Swagger / OpenAPI](#4-documentación-swagger--openapi)
5. [Frontend Completo](#5-frontend-completo)
6. [Docker Compose Full-Stack](#6-docker-compose-full-stack)
7. [Auditoría de Acciones](#7-auditoría-de-acciones)
8. [Cómo Probar Cada Mejora](#8-cómo-probar-cada-mejora)
9. [Comparativa Antes vs Después](#9-comparativa-antes-vs-después)

---

## 1. Resumen de Mejoras

| # | Mejora | Estado | Impacto |
|---|--------|:------:|---------|
| 1 | Contador de intentos MFA con bloqueo | ✅ Implementado | Seguridad |
| 2 | Soporte PostgreSQL (además de SQLite) | ✅ Implementado | Infraestructura |
| 3 | Documentación Swagger / OpenAPI | ✅ Implementado | Developer Experience |
| 4 | Frontend completo (6 páginas) | ✅ Implementado | UX/Frontend |
| 5 | Docker Compose con 3 servicios | ✅ Implementado | Infraestructura |
| 6 | Registro de auditoría de acciones | ✅ Implementado | Seguridad/Trazabilidad |

---

## 2. Contador de Intentos MFA

### Descripción

Se implementó un límite de **3 intentos fallidos** para el código MFA. Después de agotar los intentos, la cuenta queda bloqueada durante **15 minutos**.

### Campos agregados al modelo `User`

```javascript
// src/models/user.js
mfa_failed_attempts: {
  type: DataTypes.INTEGER,
  defaultValue: 0
},
mfa_lock_until: {
  type: DataTypes.DATE,
  allowNull: true
}
```

### Lógica en `authController.js`

```
POST /api/auth/mfa/verify
  │
  ├─ ¿mfa_lock_until > ahora?
  │     └─ SÍ → 423 "MFA bloqueado. Intenta en X minutos."
  │
  ├─ ¿Código incorrecto?
  │     ├─ mfa_failed_attempts++
  │     └─ ¿mfa_failed_attempts >= 3?
  │           ├─ SÍ → mfa_lock_until = ahora + 15min → 423
  │           └─ NO → 401 "Código inválido. N intentos restantes."
  │
  └─ ¿Código correcto?
        ├─ mfa_failed_attempts = 0
        ├─ mfa_lock_until = null
        └─ 200 { token: JWT_COMPLETO }
```

### Mensajes al usuario

| Intento | Mensaje |
|---------|---------|
| 1° incorrecto | "Código MFA inválido. 2 intentos restantes." |
| 2° incorrecto | "Código MFA inválido. 1 intentos restantes." |
| 3° incorrecto | "Demasiados intentos fallidos. Cuenta MFA bloqueada por 15 minutos." |
| Bloqueado | "MFA bloqueado temporalmente. Intenta más tarde." |

### Consistencia con Login

El sistema de bloqueo MFA es consistente con el bloqueo de login:

| Mecanismo | Límite | Duración del bloqueo |
|-----------|:------:|:-------------------:|
| Login fallido | 5 intentos | 15 minutos |
| MFA fallido | 3 intentos | 15 minutos |

---

## 3. Soporte PostgreSQL

### Descripción

El proyecto originalmente usaba solo SQLite. Se agregó soporte completo para **PostgreSQL** manteniendo la compatibilidad con SQLite para desarrollo local.

### Configuración multi-dialecto (`src/config.js`)

```javascript
const sequelizeConfig = {
  sqlite: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || 'database.sqlite',
    logging: false
  },
  postgres: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'techstore',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
};
```

### Selección del dialecto

```env
# Desarrollo — sin configuración adicional
DB_DIALECT=sqlite

# Producción / Docker
DB_DIALECT=postgres
DB_HOST=postgres
DB_NAME=techstore
DB_USER=techstore_user
DB_PASSWORD=techstore_pass
```

### Dependencias agregadas

```json
"pg": "^8.11.0",
"pg-hstore": "^2.3.4"
```

---

## 4. Documentación Swagger / OpenAPI

### Descripción

Se integró **swagger-ui-express** y **swagger-jsdoc** para generar documentación interactiva de la API de forma automática desde anotaciones JSDoc en el código.

### Acceso

```
http://localhost:4000/api-docs
```

### Características

- Documentación de todos los endpoints organizados por módulo
- Botón **"Authorize"** para ingresar el JWT Bearer token
- Interfaz interactiva para enviar peticiones reales desde el navegador
- Esquemas de request/response con ejemplos
- Descripción de políticas RBAC y ABAC

### Configuración (`src/swagger.js`)

```javascript
const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'TechStore API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./src/routes/*.js']
};
```

### Módulos documentados

| Módulo | Endpoints |
|--------|-----------|
| Authentication | register, login, mfa/enable, mfa/verify |
| Users | me, list, create, update, delete, assign-role |
| Roles | list, create, update, delete |
| Products | list, get, create, update, delete |

---

## 5. Frontend Completo

### Descripción

El scaffold original tenía solo Login, MFA y Productos básicos. Se expandió a **6 páginas completas** con navegación por rol, diseño responsive y componentes reutilizables.

### Páginas implementadas

| Página | Ruta | Roles con acceso |
|--------|------|-----------------|
| Login | `/login` | Pública |
| MFA | `/mfa` | Con token temporal |
| Dashboard | `/dashboard` | Todos |
| Productos | `/products` | Todos |
| Usuarios | `/users` | Solo Admin |
| Roles | `/roles` | Solo Admin |
| Auditoría | `/audit-logs` | Admin y Auditor |

### Componentes nuevos

**`ProtectedRoute.jsx`** — Verifica JWT antes de renderizar la página:
```jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

**`Layout.jsx`** — Shell con navbar lateral adaptado al rol del usuario. Solo muestra las páginas a las que el rol tiene acceso.

**`MFAModal.jsx`** — Modal para activar MFA: genera y muestra QR code usando la librería `qrcode`.

### Dashboard con estadísticas

El Dashboard muestra en tiempo real:
- Total de usuarios registrados
- Total de productos en el sistema
- Roles disponibles
- Productos por tienda (para Admin)
- Solo datos de su tienda (para Gerente/Empleado)

### Validaciones ABAC en UI

Los botones de Editar/Eliminar se muestran u ocultan según el rol:
- Admin → ve todos los botones
- Gerente → ve Editar y Eliminar (solo productos no-premium de su tienda)
- Empleado → solo puede editar el campo stock
- Auditor → no ve botones de escritura

---

## 6. Docker Compose Full-Stack

### Descripción

Se creó una configuración Docker Compose completa con los 3 servicios del sistema listos para ejecutar con un solo comando.

### Servicios configurados

```yaml
services:
  postgres:   # PostgreSQL 15 con healthcheck
  backend:    # Node.js + Express (depende de postgres healthy)
  frontend:   # React + Vite (depende de backend)
```

### Características del setup

- **Healthcheck** en PostgreSQL: el backend no inicia hasta que la BD está lista
- **Volúmenes** de código montados: hot reload sin reconstruir imagen
- **Red interna** `techstore-network`: los servicios se comunican por nombre
- **Volumen persistente** `pgdata`: los datos de la BD sobreviven reinicios
- **Variables de entorno** inyectadas por Compose

### Inicio rápido

```bash
docker compose up -d   # Levanta los 3 servicios
docker compose ps      # Verifica estado
docker compose down    # Detiene todo (preserva datos)
docker compose down -v # Detiene + elimina datos
```

---

## 7. Auditoría de Acciones

### Descripción

Todas las acciones importantes del sistema quedan registradas en la tabla `audit_logs` con el usuario que las realizó, la acción, el recurso afectado y la IP del cliente.

### Modelo `AuditLog`

```javascript
{
  usuario_id,    // FK → quién hizo la acción
  action,        // 'CREATE_PRODUCT', 'LOGIN', 'DELETE_USER'...
  resource_type, // 'Product', 'User', 'Role'
  resource_id,   // ID del recurso afectado
  details,       // JSON con contexto adicional
  ip,            // IP del cliente
  fecha          // Timestamp automático
}
```

### Acciones registradas

| Acción | Cuándo |
|--------|--------|
| `LOGIN` | Login exitoso |
| `LOGIN_FAILED` | Credenciales incorrectas |
| `MFA_BLOCKED` | MFA bloqueado por intentos |
| `CREATE_PRODUCT` | Producto creado |
| `UPDATE_PRODUCT` | Producto actualizado |
| `DELETE_PRODUCT` | Producto eliminado |
| `CREATE_USER` | Usuario creado |
| `UPDATE_USER` | Usuario actualizado |
| `DELETE_USER` | Usuario eliminado |
| `ASSIGN_ROLE` | Rol asignado a usuario |
| `CREATE_ROLE` | Rol creado |
| `DELETE_ROLE` | Rol eliminado |

### Vista en el Frontend

La página de Auditoría (solo Admin y Auditor) muestra una tabla con los últimos registros, con columnas de usuario, acción, recurso, detalles y fecha.

---

## 8. Cómo Probar Cada Mejora

### Probar bloqueo MFA

```bash
# 1. Login y habilitar MFA (como admin)
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techstore.com","password":"Admin123!"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Habilitar MFA
curl -X POST http://localhost:4000/api/auth/mfa/enable \
  -H "Authorization: Bearer $TOKEN"

# 3. Intentar verificar con código incorrecto 3 veces
for i in 1 2 3; do
  curl -X POST http://localhost:4000/api/auth/mfa/verify \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$TOKEN\",\"code\":\"000000\"}"
  echo ""
done
# El 3er intento debe devolver 423 (bloqueado)
```

### Probar restricciones ABAC

```bash
# Token de empleado (Lima)
EMPLEADO_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"empleado@techstore.com","password":"Empleado123!"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Intentar crear producto (debe fallar con 403)
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer $EMPLEADO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","precio":100,"stock":5,"tienda_id":"Lima"}'
```

### Probar Swagger UI

1. Ir a `http://localhost:4000/api-docs`
2. Expandir `POST /api/auth/login` → "Try it out"
3. Ingresar `{"email":"admin@techstore.com","password":"Admin123!"}` → Execute
4. Copiar el `token` de la respuesta
5. Click en "Authorize" (candado) → ingresar `Bearer <token>`
6. Probar `GET /api/products` → debe devolver la lista de productos

---

## 9. Comparativa Antes vs Después

### Backend

| Característica | Antes (esqueleto) | Después (implementado) |
|----------------|:-----------------:|:----------------------:|
| MFA con límite de intentos | ❌ | ✅ 3 intentos + bloqueo 15 min |
| Base de datos | Solo SQLite | SQLite + PostgreSQL |
| Documentación API | Solo README | Swagger UI interactivo |
| Docker | ❌ | ✅ Compose con 3 servicios |
| Auditoría de acciones | ❌ | ✅ Tabla audit_logs completa |

### Frontend

| Característica | Antes (scaffold) | Después (completo) |
|----------------|:----------------:|:------------------:|
| Páginas | 3 (Login, MFA, Products) | 7 páginas completas |
| Dashboard | ❌ | ✅ Estadísticas en tiempo real |
| Gestión de Usuarios | ❌ | ✅ CRUD completo (Admin) |
| Gestión de Roles | ❌ | ✅ CRUD completo (Admin) |
| Logs de Auditoría | ❌ | ✅ Tabla con historial |
| Navegación por rol | ❌ | ✅ Navbar adapta según rol |
| Diseño | Básico | Responsive y profesional |

---

## Referencias

| Documento | Descripción |
|----------|-------------|
| [README.md](./README.md) | Documentación principal |
| [DOCKER_SETUP.md](./DOCKER_SETUP.md) | Guía completa de Docker |
| [USUARIOS_PRUEBA.md](./USUARIOS_PRUEBA.md) | Usuarios y escenarios de prueba |
| [MEJORAS_FUTURAS.md](./MEJORAS_FUTURAS.md) | Roadmap pendiente |
| [Swagger UI](http://localhost:4000/api-docs) | Documentación interactiva |
