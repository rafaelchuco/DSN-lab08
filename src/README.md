# TechStore — Documentación del Backend (API)

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat&logo=express&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?style=flat&logo=sequelize&logoColor=white)

> Documentación técnica del backend de TechStore: arquitectura, middlewares, controladores, modelos y motor de políticas ABAC.

---

## Tabla de Contenidos

1. [Estructura del Backend](#1-estructura-del-backend)
2. [Punto de Entrada — server.js](#2-punto-de-entrada--serverjs)
3. [Configuración — config.js](#3-configuración--configjs)
4. [Modelos de Datos](#4-modelos-de-datos)
5. [Middlewares](#5-middlewares)
6. [Controladores](#6-controladores)
7. [Rutas](#7-rutas)
8. [Motor de Políticas ABAC](#8-motor-de-políticas-abac)
9. [Utilidades](#9-utilidades)
10. [Documentación Swagger](#10-documentación-swagger)
11. [Flujo de una Petición](#11-flujo-de-una-petición)

---

## 1. Estructura del Backend

```
src/
├── server.js              # Punto de entrada: inicialización de Express + DB + seed
├── config.js              # Configuración centralizada (DB, JWT, políticas de contraseña)
├── swagger.js             # Setup de swagger-jsdoc y swagger-ui-express
│
├── controllers/           # Lógica de negocio de cada recurso
│   ├── authController.js  # Registro, login, MFA enable/verify
│   ├── userController.js  # CRUD usuarios + asignación de roles
│   ├── roleController.js  # CRUD roles
│   └── productController.js  # CRUD productos (con contexto ABAC)
│
├── middlewares/           # Capas de seguridad por petición
│   ├── authMiddleware.js  # Verifica JWT y adjunta req.userId + req.userRoles
│   ├── rbacMiddleware.js  # Verifica que el rol tenga permiso en el endpoint
│   └── abacMiddleware.js  # Evalúa política ABAC para operaciones de productos
│
├── models/                # Definiciones Sequelize (esquemas de BD)
│   ├── index.js           # Inicialización de Sequelize + asociaciones
│   ├── user.js            # Modelo Usuario
│   ├── role.js            # Modelo Rol
│   ├── userRole.js        # Tabla pivote usuario_roles
│   ├── product.js         # Modelo Producto
│   └── auditLog.js        # Modelo de auditoría
│
├── routes/                # Definición de endpoints por módulo
│   ├── auth.js            # /api/auth/*
│   ├── users.js           # /api/users/*
│   ├── roles.js           # /api/roles/*
│   └── products.js        # /api/products/*
│
└── utils/                 # Utilidades compartidas
    ├── mfa.utils.js       # Generación/verificación de TOTP con speakeasy
    ├── policy-engine.js   # Motor de decisiones ABAC
    └── logger.js          # Logging estructurado de auditoría
```

---

## 2. Punto de Entrada — server.js

`src/server.js` realiza las siguientes tareas al iniciar:

```
1. Configura Express con middleware JSON
2. Monta Swagger UI en /api-docs
3. Registra todas las rutas (/api/auth, /api/users, /api/roles, /api/products)
4. Expone endpoint de health check GET /health
5. Sincroniza la base de datos con Sequelize (alter: true)
6. Desactiva MFA para todos los usuarios (reset de desarrollo)
7. Crea los 4 roles por defecto si no existen: Admin, Gerente, Empleado, Auditor
8. Crea el usuario administrador inicial si no existe
9. Inicia el servidor HTTP en el puerto configurado
```

### Seed Automático

Al iniciar, el servidor crea automáticamente:

| Recurso | Detalle |
|---------|---------|
| Rol Admin | Si no existe |
| Rol Gerente | Si no existe |
| Rol Empleado | Si no existe |
| Rol Auditor | Si no existe |
| Usuario admin | Si no existe (email de `.env` o `admin@techstore.com`) |

---

## 3. Configuración — config.js

Carga variables de entorno y exporta configuración centralizada:

```javascript
module.exports = {
  jwtSecret,          // Secreto para firmar JWT
  jwtExpiry,          // Vigencia del JWT (default: "1h")
  jwtMfaTempExpiry,   // Vigencia del token temporal MFA (default: "300s")
  sequelize,          // Objeto de config para Sequelize (sqlite o postgres)
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true
  }
}
```

### Soporte Multi-Dialecto

```
DB_DIALECT=sqlite   → Usa archivo local (database.sqlite) — sin configuración
DB_DIALECT=postgres → Usa servidor PostgreSQL (requiere DB_HOST, DB_NAME, etc.)
```

---

## 4. Modelos de Datos

### User (`src/models/user.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER (PK) | Identificador único |
| `email` | STRING (UNIQUE) | Email del usuario |
| `passwordHash` | STRING | Contraseña hasheada con bcrypt |
| `nombre_completo` | STRING | Nombre completo |
| `tienda_id` | STRING | Tienda asignada (clave ABAC) |
| `mfa_enabled` | BOOLEAN | Si MFA está habilitado |
| `mfa_required` | BOOLEAN | Si MFA es requerido en el próximo login |
| `mfa_secret` | STRING | Secret TOTP para MFA |
| `mfa_failed_attempts` | INTEGER | Contador de intentos MFA fallidos |
| `mfa_lock_until` | DATE | Hasta cuándo está bloqueado el MFA |
| `login_attempts` | INTEGER | Contador de intentos de login fallidos |
| `lock_until` | DATE | Hasta cuándo está bloqueada la cuenta |
| `activo` | BOOLEAN | Si la cuenta está activa |
| `fecha_creacion` | DATE | Fecha de creación |

### Role (`src/models/role.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER (PK) | Identificador único |
| `nombre` | STRING (UNIQUE) | Nombre del rol |
| `descripcion` | STRING | Descripción del rol |
| `fecha_creacion` | DATE | Fecha de creación |

### UserRole (`src/models/userRole.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER (PK) | Identificador único |
| `usuario_id` | INTEGER (FK) | ID del usuario |
| `rol_id` | INTEGER (FK) | ID del rol |
| `asignado_por` | INTEGER (FK) | ID de quien asignó el rol |
| `fecha_asignacion` | DATE | Fecha de asignación |

### Product (`src/models/product.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER (PK) | Identificador único |
| `nombre` | STRING | Nombre del producto |
| `descripcion` | TEXT | Descripción |
| `precio` | DECIMAL | Precio del producto |
| `stock` | INTEGER | Cantidad en stock |
| `categoria` | STRING | Categoría del producto |
| `tienda_id` | STRING | Tienda a la que pertenece (clave ABAC) |
| `es_premium` | BOOLEAN | Si es un producto premium (clave ABAC) |
| `creado_por` | INTEGER (FK) | ID del usuario que lo creó |
| `fecha_creacion` | DATE | Fecha de creación |
| `fecha_actualizacion` | DATE | Última actualización |

### AuditLog (`src/models/auditLog.js`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER (PK) | Identificador único |
| `usuario_id` | INTEGER (FK) | Usuario que realizó la acción |
| `action` | STRING | Acción realizada (CREATE, UPDATE, DELETE, LOGIN, etc.) |
| `resource_type` | STRING | Tipo de recurso (User, Product, Role) |
| `resource_id` | STRING | ID del recurso afectado |
| `details` | JSON | Detalles adicionales de la acción |
| `ip` | STRING | IP del cliente |
| `fecha` | DATE | Timestamp de la acción |

### Asociaciones entre Modelos

```
User       hasMany    UserRole   (usuario_id)
Role       hasMany    UserRole   (rol_id)
UserRole   belongsTo  User       (usuario_id)
UserRole   belongsTo  Role       (rol_id)
User       hasMany    Product    (creado_por)
Product    belongsTo  User       (creado_por)
User       hasMany    AuditLog   (usuario_id)
AuditLog   belongsTo  User       (usuario_id)
```

---

## 5. Middlewares

### authMiddleware.js

Verifica el JWT en el header `Authorization: Bearer <token>`.

```
Petición entrante
       │
       ▼
¿Existe header Authorization?
  No → 401 "Token requerido"

¿Es un JWT válido y no expirado?
  No → 401 "Token inválido o expirado"

¿El usuario existe y está activo?
  No → 401 "Usuario no encontrado o inactivo"

Adjunta al request:
  req.userId    = user.id
  req.userRoles = ['Admin']  // array de nombres de roles

       │
       ▼
      next()
```

### rbacMiddleware.js

Verifica que alguno de los roles del usuario tenga permiso para el endpoint.

```javascript
// Uso en rutas:
router.delete('/:id', auth, rbac(['Admin']), roleController.delete)
// Solo usuarios con rol Admin pueden acceder a DELETE /api/roles/:id
```

### abacMiddleware.js

Evalúa la política ABAC usando el motor de políticas (`policy-engine.js`).

```
Extrae userId de req.userId
  → Carga usuario y sus roles desde DB

Si la ruta tiene :id → Carga el producto de la BD

Llama policy.isAllowed({
  roles: ['Gerente'],
  user: { tienda_id: 'Lima', ... },
  action: 'delete',
  resource: { tienda_id: 'Arequipa', es_premium: false },
  payload: req.body
})

allowed = false → 403 "Acceso denegado por políticas"
allowed = true  → adjunta req._abac = { roles, user, resource } y next()
```

---

## 6. Controladores

### authController.js

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `register` | POST /api/auth/register | Valida contraseña, hashea con bcrypt, crea usuario |
| `login` | POST /api/auth/login | Verifica credenciales, gestiona bloqueos, emite JWT o token temporal MFA |
| `mfaVerify` | POST /api/auth/mfa/verify | Verifica código TOTP, gestiona bloqueo MFA, emite JWT completo |
| `mfaEnable` | POST /api/auth/mfa/enable | Genera secret TOTP, devuelve QR URL y secret |

**Lógica de bloqueo de login:**
```
login_attempts >= 5 AND lock_until > now() → 423 (bloqueado)
contraseña incorrecta → login_attempts++
login_attempts == 5 → lock_until = now() + 15min
contraseña correcta → login_attempts = 0
```

**Lógica de bloqueo MFA:**
```
mfa_lock_until > now() → 423 (MFA bloqueado)
código incorrecto → mfa_failed_attempts++
mfa_failed_attempts >= 3 → mfa_lock_until = now() + 15min
código correcto → mfa_failed_attempts = 0, mfa_lock_until = null
```

### userController.js

| Función | Endpoint | Rol | Descripción |
|---------|----------|-----|-------------|
| `me` | GET /api/users/me | Cualquiera | Perfil propio con roles |
| `list` | GET /api/users | Admin | Lista todos los usuarios |
| `create` | POST /api/users | Admin | Crea usuario (valida contraseña) |
| `update` | PUT /api/users/:id | Admin | Actualiza datos del usuario |
| `remove` | DELETE /api/users/:id | Admin | Elimina usuario |
| `assignRole` | POST /api/users/:id/roles | Admin | Asigna rol al usuario |

### roleController.js

| Función | Endpoint | Rol | Descripción |
|---------|----------|-----|-------------|
| `list` | GET /api/roles | Cualquiera | Lista todos los roles |
| `create` | POST /api/roles | Admin | Crea un nuevo rol |
| `update` | PUT /api/roles/:id | Admin | Actualiza nombre/descripción |
| `remove` | DELETE /api/roles/:id | Admin | Elimina rol (falla si tiene usuarios) |

### productController.js

| Función | Endpoint | Descripción |
|---------|----------|-------------|
| `list` | GET /api/products | Lista productos según scope ABAC del usuario |
| `get` | GET /api/products/:id | Obtiene producto (verificado por ABAC) |
| `create` | POST /api/products | Crea producto (validado por ABAC) |
| `update` | PUT /api/products/:id | Actualiza (campos según rol ABAC) |
| `remove` | DELETE /api/products/:id | Elimina (ABAC: premium solo Admin) |

Todos los controladores de productos registran la acción en `audit_logs`.

---

## 7. Rutas

### auth.js — `/api/auth/*`

```
POST /api/auth/register           → authController.register
POST /api/auth/login              → authController.login
POST /api/auth/mfa/verify         → authController.mfaVerify
POST /api/auth/mfa/enable         → [auth] authController.mfaEnable
```

### users.js — `/api/users/*`

```
GET    /api/users/me              → [auth]             userController.me
GET    /api/users                 → [auth, rbac(Admin)] userController.list
POST   /api/users                 → [auth, rbac(Admin)] userController.create
PUT    /api/users/:id             → [auth, rbac(Admin)] userController.update
DELETE /api/users/:id             → [auth, rbac(Admin)] userController.remove
POST   /api/users/:id/roles       → [auth, rbac(Admin)] userController.assignRole
```

### roles.js — `/api/roles/*`

```
GET    /api/roles                 → [auth]             roleController.list
POST   /api/roles                 → [auth, rbac(Admin)] roleController.create
PUT    /api/roles/:id             → [auth, rbac(Admin)] roleController.update
DELETE /api/roles/:id             → [auth, rbac(Admin)] roleController.remove
```

### products.js — `/api/products/*`

```
GET    /api/products              → [auth, abac(select)] productController.list
GET    /api/products/:id          → [auth, abac(select)] productController.get
POST   /api/products              → [auth, abac(insert)] productController.create
PUT    /api/products/:id          → [auth, abac(update)] productController.update
DELETE /api/products/:id          → [auth, abac(delete)] productController.remove
```

---

## 8. Motor de Políticas ABAC

`src/utils/policy-engine.js` implementa la función central de decisión de acceso:

```javascript
policy.isAllowed({ roles, user, action, resource, payload })
// Retorna: true (permitido) | false (denegado)
```

### Árbol de Decisión

```
isAllowed(roles, user, action, resource, payload)
  │
  ├─ roles.includes('Admin') → true (siempre permitido)
  │
  ├─ roles.includes('Auditor')
  │   ├─ action == 'select' → true
  │   └─ action != 'select' → false
  │
  ├─ action == 'select'
  │   ├─ roles.includes('Gerente') o 'Empleado'
  │   │   └─ user.tienda_id == resource?.tienda_id → true | false
  │   └─ otros roles → false
  │
  ├─ action == 'insert'
  │   ├─ roles.includes('Empleado') → false
  │   ├─ payload.es_premium && !roles.includes('Admin') → false
  │   ├─ roles.includes('Gerente')
  │   │   └─ user.tienda_id == payload.tienda_id → true | false
  │   └─ otros → false
  │
  ├─ action == 'update'
  │   ├─ resource?.tienda_id != user.tienda_id → false
  │   ├─ roles.includes('Empleado')
  │   │   └─ solo permite campo 'stock' en payload → true | false
  │   ├─ roles.includes('Gerente')
  │   │   └─ no permite campo 'categoria' → true | false
  │   └─ otros → false
  │
  └─ action == 'delete'
      ├─ resource?.tienda_id != user.tienda_id → false
      ├─ resource?.es_premium → false (solo Admin puede)
      ├─ roles.includes('Empleado') → false
      └─ roles.includes('Gerente') → true
```

---

## 9. Utilidades

### mfa.utils.js

Wrapper sobre la librería `speakeasy` para operaciones TOTP:

```javascript
generateSecret(email)
// → { secret, otpauth_url }
// secret: base32 para guardar en DB
// otpauth_url: URL para generar QR

verifyTOTP(secret, token)
// → boolean
// Verifica código TOTP con ventana de ±1 período (30s cada uno)
```

### logger.js

Función de auditoría que registra en la tabla `audit_logs`:

```javascript
await logAction({
  userId,           // ID del usuario que realiza la acción
  action,           // 'CREATE_PRODUCT', 'LOGIN', 'DELETE_USER', etc.
  resourceType,     // 'Product', 'User', 'Role'
  resourceId,       // ID del recurso afectado
  details,          // Objeto JSON con contexto adicional
  ip                // IP del cliente (req.ip)
})
```

---

## 10. Documentación Swagger

`src/swagger.js` configura swagger-jsdoc para leer anotaciones JSDoc de las rutas y generar una especificación OpenAPI 3.0.

**URL de acceso:** `http://localhost:4000/api-docs`

### Características

- Documentación de todos los endpoints con esquemas de request/response
- Botón "Authorize" para introducir el JWT Bearer token
- Interfaz interactiva para probar cada endpoint en vivo
- Ejemplos de request body y response

---

## 11. Flujo de una Petición

### Ejemplo: PUT /api/products/:id (Actualizar Producto)

```
1. Request: PUT /api/products/42
   Headers: Authorization: Bearer eyJhbGc...
   Body: { "stock": 50 }

2. authMiddleware
   → Decodifica JWT: { sub: 5, roles: ['Empleado'] }
   → Adjunta: req.userId = 5, req.userRoles = ['Empleado']

3. abacMiddleware.permit('update')
   → Carga User id=5: { tienda_id: 'Lima', ... }
   → Carga Product id=42: { tienda_id: 'Lima', es_premium: false, ... }
   → Llama policy.isAllowed({
       roles: ['Empleado'],
       user: { tienda_id: 'Lima' },
       action: 'update',
       resource: { tienda_id: 'Lima', es_premium: false },
       payload: { stock: 50 }
     })
   → Empleado solo puede actualizar 'stock', payload tiene solo 'stock' → true
   → Adjunta: req._abac = { roles, user, resource }

4. productController.update
   → Actualiza product.stock = 50
   → Guarda en DB
   → Llama logAction({ userId: 5, action: 'UPDATE_PRODUCT', ... })
   → Responde: 200 { producto actualizado }

5. AuditLog creado en BD:
   { usuario_id: 5, action: 'UPDATE_PRODUCT', resource_type: 'Product',
     resource_id: '42', details: { campo: 'stock', valor: 50 }, ip: '...' }
```

---

## Referencia

| Documento | Descripción |
|----------|-------------|
| [../README.md](../README.md) | Documentación principal del proyecto |
| [../DOCKER_SETUP.md](../DOCKER_SETUP.md) | Guía de Docker |
| [../client/README.md](../client/README.md) | Documentación del frontend |
| [../USUARIOS_PRUEBA.md](../USUARIOS_PRUEBA.md) | Usuarios y escenarios de prueba |
| [Swagger UI](http://localhost:4000/api-docs) | Documentación interactiva de la API |
