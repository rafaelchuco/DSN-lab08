# TechStore — Sistema de Gestión de Inventario

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat&logo=express&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?style=flat&logo=sequelize&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)

> **TechStore** es una aplicación web fullstack para gestión de inventario con seguridad avanzada: autenticación MFA (TOTP), control de acceso basado en roles **(RBAC)**, control de acceso basado en atributos **(ABAC)** y auditoría completa de todas las acciones del sistema.

---

## Tabla de Contenidos

1. [Caso de Estudio](#1-caso-de-estudio)
2. [Características Implementadas](#2-características-implementadas)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Estructura del Proyecto](#5-estructura-del-proyecto)
6. [Modelos de Datos](#6-modelos-de-datos)
7. [Flujo de Autenticación](#7-flujo-de-autenticación)
8. [Autorización RBAC y ABAC](#8-autorización-rbac-y-abac)
9. [API Endpoints](#9-api-endpoints)
10. [Inicio Rápido con Docker](#10-inicio-rápido-con-docker)
11. [Desarrollo Local sin Docker](#11-desarrollo-local-sin-docker)
12. [Variables de Entorno](#12-variables-de-entorno)
13. [Usuarios de Prueba](#13-usuarios-de-prueba)
14. [Notas de Seguridad](#14-notas-de-seguridad)

---

## 1. Caso de Estudio

### Contexto del Negocio

**TechStore** es una cadena de tiendas de tecnología que necesita un sistema centralizado para gestionar su inventario de productos. La empresa tiene distintos tipos de usuarios con diferentes niveles de acceso y responsabilidades operativas.

### Objetivo del Proyecto

Desarrollar una aplicación web que implemente controles de seguridad robustos para proteger datos sensibles y operaciones críticas del negocio, garantizando que cada usuario solo pueda realizar las acciones que le corresponden según su rol y los atributos de los recursos.

### Perfiles de Usuario

| Perfil | Responsabilidades |
|--------|------------------|
| **Administrador** | Gestiona usuarios y roles, configuración del sistema, acceso total |
| **Gerente de Tienda** | Gestiona productos de su tienda, no puede operar en otras tiendas |
| **Empleado de Ventas** | Consulta productos y actualiza stock, sin modificar precios |
| **Auditor** | Solo lectura de todos los datos, genera reportes, sin permisos de escritura |

### Fases del Proyecto

```
Fase 1 — Autenticación
  ├─ Registro con validaciones (email único, contraseña fuerte)
  ├─ Login con bloqueo tras 5 intentos fallidos
  ├─ JWT para sesiones
  └─ MFA TOTP con Google Authenticator

Fase 2 — RBAC (Role-Based Access Control)
  ├─ CRUD de roles
  ├─ CRUD de usuarios con asignación de roles
  └─ Middleware de verificación de roles en endpoints

Fase 3 — ABAC (Attribute-Based Access Control)
  ├─ CRUD de productos con motor de políticas
  ├─ Restricciones por tienda_id y es_premium
  └─ Registro de auditoría de todas las acciones
```

---

## 2. Características Implementadas

### Backend

| Característica | Estado | Descripción |
|---------------|--------|-------------|
| Registro de usuarios | ✅ | Email único, contraseña fuerte con bcrypt |
| Login con bloqueo | ✅ | Bloqueo automático tras 5 intentos fallidos |
| JWT | ✅ | Tokens con expiración configurable |
| MFA TOTP | ✅ | Autenticación de dos factores con speakeasy |
| Bloqueo MFA | ✅ | Bloqueo de 15 min tras 3 intentos MFA fallidos |
| RBAC | ✅ | Control de acceso basado en roles |
| ABAC | ✅ | Control de acceso basado en atributos |
| Auditoría | ✅ | Log de todas las acciones en `audit_logs` |
| Swagger UI | ✅ | Documentación interactiva en `/api-docs` |
| PostgreSQL | ✅ | Base de datos relacional en producción |
| SQLite | ✅ | Base de datos local para desarrollo sin configuración |

### Frontend

| Característica | Estado | Descripción |
|---------------|--------|-------------|
| Login + MFA | ✅ | Flujo completo de autenticación |
| Dashboard | ✅ | Estadísticas generales del sistema |
| Gestión de Productos | ✅ | CRUD completo con validaciones ABAC |
| Gestión de Usuarios | ✅ | Solo visible para Admin |
| Gestión de Roles | ✅ | Solo visible para Admin |
| Logs de Auditoría | ✅ | Historial de acciones del sistema |
| Rutas protegidas | ✅ | `ProtectedRoute` con verificación de rol |
| Diseño responsive | ✅ | Compatible con móvil y escritorio |

---

## 3. Stack Tecnológico

### Backend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Node.js | 18+ | Runtime JavaScript |
| Express | 4.18 | Framework HTTP |
| Sequelize | 6 | ORM para SQL |
| PostgreSQL | 15 | Base de datos en producción |
| SQLite | 3 | Base de datos en desarrollo |
| bcrypt | 5 | Hash seguro de contraseñas |
| jsonwebtoken | 9 | Autenticación JWT |
| speakeasy | 2 | Generación/verificación TOTP |
| swagger-jsdoc | 6 | Generación de spec OpenAPI |
| swagger-ui-express | 5 | Interfaz Swagger interactiva |
| dotenv | 16 | Gestión de variables de entorno |
| nodemon | 2 | Hot reload en desarrollo |

### Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| React | 18 | UI Library |
| Vite | 5 | Build tool y dev server |
| Axios | 1.6 | Cliente HTTP |
| QRCode | 1.5 | Generación de QR para MFA |

### Infraestructura

| Tecnología | Propósito |
|-----------|-----------|
| Docker | Contenedorización de servicios |
| Docker Compose | Orquestación multi-contenedor |

---

## 4. Arquitectura del Sistema

### Visión General

```
┌─────────────────────────────────────────────────────────────────┐
│                     TECHSTORE SYSTEM                            │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │   FRONTEND       │         │   BACKEND                    │  │
│  │   React + Vite   │──HTTP──▶│   Node.js + Express          │  │
│  │   Puerto 5174    │  /api/* │   Puerto 4000                │  │
│  │                  │         │                              │  │
│  │  Pages:          │         │  Middlewares:                │  │
│  │  · Dashboard     │         │  · authMiddleware (JWT)      │  │
│  │  · Login/MFA     │         │  · rbacMiddleware (roles)    │  │
│  │  · Products      │         │  · abacMiddleware (atribs)   │  │
│  │  · Users         │         │                              │  │
│  │  · Roles         │         │  Controllers:                │  │
│  │  · AuditLogs     │         │  · authController            │  │
│  └──────────────────┘         │  · userController            │  │
│                               │  · roleController            │  │
│                               │  · productController         │  │
│                               │                              │  │
│                               │  Swagger UI: /api-docs       │  │
│                               └──────────────┬───────────────┘  │
│                                              │                  │
│                                              ▼                  │
│                               ┌──────────────────────────────┐  │
│                               │   BASE DE DATOS              │  │
│                               │   PostgreSQL 15              │  │
│                               │   Puerto 5433                │  │
│                               │                              │  │
│                               │  Tablas:                     │  │
│                               │  · usuarios                  │  │
│                               │  · roles                     │  │
│                               │  · usuario_roles             │  │
│                               │  · productos                 │  │
│                               │  · audit_logs                │  │
│                               └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Red Docker

```
┌─────────────────────────────────────────────────────────────────┐
│            techstore-network (Docker bridge)                    │
│                                                                 │
│   ┌─────────────────┐    ┌─────────────────┐                   │
│   │ techstore-       │    │ techstore-       │                   │
│   │ frontend         │───▶│ backend          │                   │
│   │ :5174 → :5173   │    │ :4000 → :4000   │                   │
│   └─────────────────┘    └────────┬────────┘                   │
│                                   │                             │
│                                   ▼                             │
│                          ┌─────────────────┐                   │
│                          │ techstore-        │                   │
│                          │ postgres          │                   │
│                          │ :5433 → :5432    │                   │
│                          └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de una Petición HTTP

```
Navegador / Cliente
       │
       │  GET /api/products  (+ Authorization: Bearer <JWT>)
       ▼
  Express Router
       │
       ├─▶ authMiddleware
       │     ├─ Verifica que el token JWT exista
       │     ├─ Verifica que no esté expirado
       │     └─ Adjunta usuario decodificado en req.user
       │
       ├─▶ rbacMiddleware
       │     ├─ Lee rol de req.user
       │     └─ Verifica que el rol tenga acceso al endpoint
       │
       ├─▶ abacMiddleware (solo productos)
       │     ├─ Lee tienda_id del usuario
       │     ├─ Lee atributos del recurso (es_premium, tienda_id)
       │     └─ Evalúa política ABAC → allow / deny
       │
       ├─▶ productController
       │     ├─ Consulta base de datos con Sequelize
       │     └─ Retorna respuesta JSON
       │
       └─▶ AuditLog
             └─ Registra: usuario, acción, recurso, IP, timestamp
```

---

## 5. Estructura del Proyecto

```
DSN-lab08/
├── src/                          # Backend (Node.js + Express)
│   ├── server.js                 # Punto de entrada, inicialización y seed
│   ├── config.js                 # Configuración de DB, JWT y puertos
│   ├── swagger.js                # Configuración Swagger / OpenAPI
│   ├── controllers/
│   │   ├── authController.js     # Registro, login, MFA (enable/verify)
│   │   ├── userController.js     # CRUD usuarios + asignación de roles
│   │   ├── roleController.js     # CRUD roles
│   │   └── productController.js  # CRUD productos con filtros ABAC
│   ├── middlewares/
│   │   ├── authMiddleware.js     # Validación y decodificación de JWT
│   │   ├── rbacMiddleware.js     # Verificación de roles por endpoint
│   │   └── abacMiddleware.js     # Motor de políticas ABAC para productos
│   ├── models/
│   │   ├── index.js              # Sequelize init + asociaciones entre modelos
│   │   ├── user.js               # Modelo Usuario (con campos MFA y bloqueo)
│   │   ├── role.js               # Modelo Rol
│   │   ├── userRole.js           # Tabla pivote Usuario-Rol
│   │   ├── product.js            # Modelo Producto (con tienda_id y es_premium)
│   │   └── auditLog.js           # Modelo de logs de auditoría
│   ├── routes/
│   │   ├── auth.js               # Rutas /api/auth/*
│   │   ├── users.js              # Rutas /api/users/*
│   │   ├── roles.js              # Rutas /api/roles/*
│   │   └── products.js           # Rutas /api/products/*
│   └── utils/
│       ├── mfa.utils.js          # Generación y verificación de TOTP
│       ├── policy-engine.js      # Lógica del motor de políticas ABAC
│       └── logger.js             # Utilidad de logging estructurado
│
├── client/                       # Frontend (React + Vite)
│   ├── index.html                # HTML raíz
│   ├── vite.config.js            # Config Vite + proxy /api → localhost:4000
│   ├── package.json              # Dependencias del frontend
│   ├── Dockerfile                # Imagen Docker del frontend
│   └── src/
│       ├── App.jsx               # Router principal con rutas protegidas
│       ├── main.jsx              # Punto de entrada React DOM
│       ├── styles.css            # Estilos globales
│       ├── components/
│       │   ├── Layout.jsx        # Layout con barra de navegación lateral
│       │   ├── MFAModal.jsx      # Modal para configurar MFA (QR + secret)
│       │   └── ProtectedRoute.jsx# HOC que redirige si no hay JWT válido
│       └── pages/
│           ├── Login.jsx         # Formulario de autenticación
│           ├── MFA.jsx           # Ingreso de código TOTP
│           ├── Dashboard.jsx     # Panel con estadísticas
│           ├── Products.jsx      # CRUD de productos con validación ABAC
│           ├── Users.jsx         # Gestión de usuarios (solo Admin)
│           ├── Roles.jsx         # Gestión de roles (solo Admin)
│           └── AuditLogs.jsx     # Tabla de logs de auditoría
│
├── Dockerfile                    # Imagen Docker del backend
├── docker-compose.yml            # Orquestación: postgres + backend + frontend
├── start-docker.sh               # Script de inicio rápido con Docker
├── package.json                  # Dependencias y scripts del backend
├── README.md                     # Este archivo
├── DOCKER_SETUP.md               # Guía completa de Docker y comandos
├── USUARIOS_PRUEBA.md            # Credenciales y escenarios de prueba
├── GUIA_MEJORAS.md               # Mejoras implementadas y cómo usarlas
└── MEJORAS_FUTURAS.md            # Roadmap y mejoras opcionales
```

---

## 6. Modelos de Datos

### Diagrama Entidad-Relación

```
┌──────────────────────────────────┐
│           usuarios               │
├──────────────────────────────────┤
│ id               (PK)            │
│ email            (UNIQUE)        │
│ passwordHash                     │
│ nombre_completo                  │
│ tienda_id        ◄── atributo ABAC
│ mfa_enabled      (boolean)       │
│ mfa_secret                       │
│ mfa_required     (boolean)       │
│ mfa_failed_attempts (int)        │
│ mfa_lock_until   (datetime)      │
│ login_attempts   (int)           │
│ lock_until       (datetime)      │
│ activo           (boolean)       │
│ fecha_creacion                   │
└──────────┬───────────────────────┘
           │ 1
           │
           │ N
┌──────────▼───────────────────────┐      ┌───────────────────────┐
│         usuario_roles             │      │         roles          │
├──────────────────────────────────┤      ├───────────────────────┤
│ id           (PK)                 │      │ id         (PK)        │
│ usuario_id   (FK → usuarios)      │      │ nombre     (UNIQUE)    │
│ rol_id       (FK → roles) ────────┼─────▶│ descripcion           │
│ asignado_por (FK → usuarios)      │      │ fecha_creacion        │
│ fecha_asignacion                  │      └───────────────────────┘
└──────────────────────────────────┘

┌──────────────────────────────────┐
│           productos              │
├──────────────────────────────────┤
│ id               (PK)            │
│ nombre                           │
│ descripcion                      │
│ precio           (decimal)       │
│ stock            (int)           │
│ categoria                        │
│ tienda_id        ◄── atributo ABAC
│ es_premium       ◄── atributo ABAC
│ creado_por       (FK → usuarios) │
│ fecha_creacion                   │
│ fecha_actualizacion              │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│           audit_logs             │
├──────────────────────────────────┤
│ id               (PK)            │
│ usuario_id       (FK → usuarios) │
│ action           (string)        │
│ resource_type    (string)        │
│ resource_id      (string)        │
│ details          (JSON)          │
│ ip               (string)        │
│ fecha            (datetime)      │
└──────────────────────────────────┘
```

### Campos Clave para Seguridad

| Campo | Tabla | Propósito |
|-------|-------|-----------|
| `tienda_id` | usuarios / productos | Define el alcance geográfico del usuario/recurso (ABAC) |
| `es_premium` | productos | Solo Admin puede eliminar productos premium (ABAC) |
| `mfa_failed_attempts` | usuarios | Contador de intentos MFA fallidos (max 3) |
| `mfa_lock_until` | usuarios | Timestamp de fin de bloqueo MFA (15 minutos) |
| `login_attempts` | usuarios | Contador de intentos de login fallidos (max 5) |
| `lock_until` | usuarios | Timestamp de fin de bloqueo de cuenta |
| `asignado_por` | usuario_roles | Trazabilidad de quién asignó el rol |

---

## 7. Flujo de Autenticación

### Login con MFA — Paso a Paso

```
PASO 1: Usuario ingresa email + contraseña
────────────────────────────────────────────
  Frontend ──POST /api/auth/login──▶ Backend

  Backend verifica:
  ┌─ ¿Cuenta bloqueada? (lock_until > ahora)
  │   └─ SÍ → 423 "Cuenta bloqueada temporalmente"
  │
  ├─ ¿Contraseña incorrecta?
  │   ├─ Incrementa login_attempts
  │   └─ SI login_attempts >= 5 → bloquea cuenta por 15 min
  │
  └─ ¿Contraseña correcta?
      └─ Reset login_attempts = 0
          │
          ├─ MFA no habilitado → 200 { token: JWT_COMPLETO }
          │   └─ Frontend → Dashboard
          │
          └─ MFA habilitado → 200 { mfa_required: true, token: JWT_TEMP }
              └─ Frontend → Pantalla MFA


PASO 2: Usuario ingresa código TOTP (6 dígitos)
────────────────────────────────────────────
  Frontend ──POST /api/auth/mfa/verify──▶ Backend

  Backend verifica:
  ┌─ ¿MFA bloqueado? (mfa_lock_until > ahora)
  │   └─ SÍ → 423 "MFA bloqueado por 15 min"
  │
  ├─ ¿Código incorrecto?
  │   ├─ Incrementa mfa_failed_attempts
  │   └─ SI mfa_failed_attempts >= 3 → bloquea MFA por 15 min
  │
  └─ ¿Código correcto?
      ├─ Reset mfa_failed_attempts = 0
      └─ 200 { token: JWT_COMPLETO }
          └─ Frontend → Dashboard
```

### Estructura del JWT

```
Header:  { alg: "HS256", typ: "JWT" }
Payload: {
  sub: <user_id>,
  email: <email>,
  roles: ["Admin"],  // o ["Gerente"], ["Empleado"], ["Auditor"]
  iat: <issued_at>,
  exp: <expires_at>
}
Signature: HMACSHA256(base64(header) + "." + base64(payload), JWT_SECRET)
```

---

## 8. Autorización RBAC y ABAC

### RBAC — Acceso a Módulos

```
                    Admin  Gerente  Empleado  Auditor
                      │       │        │        │
Dashboard             ✅      ✅       ✅       ✅
Gestión Usuarios      ✅      ❌       ❌       ❌
Gestión Roles         ✅      ❌       ❌       ❌
Gestión Productos     ✅      ✅       ✅       ✅ (solo lectura)
Logs de Auditoría     ✅      ❌       ❌       ✅
```

### RBAC — Permisos sobre Roles

| Operación | Admin | Gerente | Empleado | Auditor |
|-----------|:-----:|:-------:|:--------:|:-------:|
| Crear rol | ✅ | ❌ | ❌ | ❌ |
| Ver roles | ✅ | ✅ | ✅ | ✅ |
| Editar rol | ✅ | ❌ | ❌ | ❌ |
| Eliminar rol | ✅ | ❌ | ❌ | ❌ |
| Eliminar rol con usuarios | ❌ | ❌ | ❌ | ❌ |

### ABAC — Políticas de Productos

| Operación | Admin | Gerente | Empleado | Auditor |
|-----------|:-----:|:-------:|:--------:|:-------:|
| Ver todos los productos | ✅ | ❌ | ❌ | ✅ |
| Ver productos de su tienda | ✅ | ✅ | ✅ | ✅ |
| Crear en cualquier tienda | ✅ | ❌ | ❌ | ❌ |
| Crear en su tienda | ✅ | ✅ | ❌ | ❌ |
| Crear producto premium | ✅ | ❌ | ❌ | ❌ |
| Actualizar cualquier campo | ✅ | ❌ | ❌ | ❌ |
| Actualizar su tienda (sin categoría) | ✅ | ✅ | ❌ | ❌ |
| Actualizar solo stock | ✅ | ✅ | ✅ | ❌ |
| Eliminar cualquier producto | ✅ | ❌ | ❌ | ❌ |
| Eliminar no-premium de su tienda | ✅ | ✅ | ❌ | ❌ |
| Eliminar producto premium | ✅ | ❌ | ❌ | ❌ |

### Lógica del Motor ABAC

```
función evaluarAcceso(usuario, acción, producto):

  si usuario.rol == 'Admin':
    retornar PERMITIDO (sin restricciones)

  si usuario.tienda_id != producto.tienda_id:
    retornar DENEGADO ("Acceso restringido a tu tienda")

  si acción == 'DELETE':
    si producto.es_premium:
      retornar DENEGADO ("Solo Admin puede eliminar productos premium")
    si usuario.rol == 'Empleado':
      retornar DENEGADO ("Sin permiso de eliminación")

  si acción == 'CREATE':
    si producto.es_premium y usuario.rol != 'Admin':
      retornar DENEGADO ("Solo Admin puede crear productos premium")
    si usuario.rol == 'Empleado':
      retornar DENEGADO ("Sin permiso de creación")

  si acción == 'UPDATE':
    si usuario.rol == 'Gerente':
      campos_permitidos = [todo excepto 'categoria']
    si usuario.rol == 'Empleado':
      campos_permitidos = ['stock']
    si usuario.rol == 'Auditor':
      retornar DENEGADO

  retornar PERMITIDO
```

---

## 9. API Endpoints

La documentación interactiva completa está en **Swagger UI**: `http://localhost:4000/api-docs`

### Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|:----:|-------------|
| `POST` | `/api/auth/register` | ❌ | Registrar nuevo usuario |
| `POST` | `/api/auth/login` | ❌ | Login → JWT o MFA pendiente |
| `POST` | `/api/auth/mfa/verify` | Token temporal | Verificar código TOTP |
| `POST` | `/api/auth/mfa/enable` | JWT | Habilitar MFA para el usuario |

```bash
# Ejemplo: Registro
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@techstore.com","password":"Pass123!","nombre_completo":"Ana García","tienda_id":"Lima"}'

# Ejemplo: Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techstore.com","password":"Admin123!"}'
```

### Usuarios

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|:----:|-----|-------------|
| `GET` | `/api/users/me` | JWT | Cualquiera | Perfil propio + roles |
| `GET` | `/api/users` | JWT | Admin | Listar todos los usuarios |
| `POST` | `/api/users` | JWT | Admin | Crear usuario |
| `PUT` | `/api/users/:id` | JWT | Admin | Actualizar usuario |
| `DELETE` | `/api/users/:id` | JWT | Admin | Eliminar usuario |
| `POST` | `/api/users/:id/roles` | JWT | Admin | Asignar rol al usuario |

### Roles

| Método | Endpoint | Auth | Rol | Descripción |
|--------|----------|:----:|-----|-------------|
| `GET` | `/api/roles` | JWT | Cualquiera | Listar roles |
| `POST` | `/api/roles` | JWT | Admin | Crear rol |
| `PUT` | `/api/roles/:id` | JWT | Admin | Actualizar rol |
| `DELETE` | `/api/roles/:id` | JWT | Admin | Eliminar rol |

### Productos

| Método | Endpoint | Auth | Descripción |
|--------|----------|:----:|-------------|
| `GET` | `/api/products` | JWT | Listar (scope ABAC por tienda) |
| `GET` | `/api/products/:id` | JWT | Obtener producto (verificación ABAC) |
| `POST` | `/api/products` | JWT | Crear producto (validación ABAC) |
| `PUT` | `/api/products/:id` | JWT | Actualizar (campos según ABAC) |
| `DELETE` | `/api/products/:id` | JWT | Eliminar (ABAC: premium solo Admin) |

### Códigos de Respuesta HTTP

| Código | Significado |
|--------|-------------|
| `200` | OK — Operación exitosa |
| `201` | Created — Recurso creado |
| `400` | Bad Request — Datos inválidos o faltantes |
| `401` | Unauthorized — Token inválido o expirado |
| `403` | Forbidden — Sin permisos (RBAC/ABAC) |
| `404` | Not Found — Recurso no encontrado |
| `423` | Locked — Cuenta o MFA bloqueado temporalmente |
| `500` | Internal Server Error — Error del servidor |

---

## 10. Inicio Rápido con Docker

La forma más rápida de ejecutar la aplicación completa.

### Requisitos Previos

```bash
# Verificar instalación
docker --version        # Docker 20.10+
docker compose version  # Docker Compose v2+
```

### Iniciar la Aplicación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd DSN-lab08

# 2. Levantar todos los servicios en segundo plano
docker compose up -d

# 3. Verificar estado de los contenedores
docker compose ps
```

**Salida esperada:**

```
NAME                   STATUS          PORTS
techstore-postgres     Up (healthy)    0.0.0.0:5433->5432/tcp
techstore-backend      Up              0.0.0.0:4000->4000/tcp
techstore-frontend     Up              0.0.0.0:5174->5173/tcp
```

### URLs de Acceso

| Servicio | URL | Descripción |
|---------|-----|-------------|
| **Frontend** | http://localhost:5174 | Interfaz web completa |
| **Backend API** | http://localhost:4000 | API REST |
| **Swagger UI** | http://localhost:4000/api-docs | Documentación interactiva |
| **PostgreSQL** | localhost:5433 | Acceso directo a la DB |

### Credenciales Iniciales

| Campo | Valor |
|-------|-------|
| **Email** | `admin@techstore.com` |
| **Contraseña** | `Admin123!` |
| **Rol** | Administrador (acceso total) |

### Comandos de Gestión Docker

```bash
# Ver logs en tiempo real (todos los servicios)
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Reiniciar un servicio
docker compose restart backend

# Detener todos los servicios
docker compose down

# Reset completo (elimina datos de la BD)
docker compose down -v

# Reconstruir imágenes después de cambios en código
docker compose build --no-cache && docker compose up -d
```

### Acceso Directo a la Base de Datos

```bash
# Conectar a PostgreSQL dentro del contenedor
docker exec -it techstore-postgres psql -U techstore_user -d techstore

# Consultas útiles una vez dentro:
\dt                                           -- Ver todas las tablas
SELECT id, email, activo FROM usuarios;       -- Ver usuarios
SELECT nombre, descripcion FROM roles;        -- Ver roles
SELECT nombre, tienda_id, es_premium FROM productos LIMIT 10;
SELECT * FROM audit_logs ORDER BY fecha DESC LIMIT 20;
```

---

## 11. Desarrollo Local sin Docker

### Requisitos

- **Node.js** 18+ → [descargar en nodejs.org](https://nodejs.org)
- **npm** 8+

### Iniciar el Backend

```bash
# Desde la raíz del proyecto
npm install

# Crear .env (opcional, hay valores por defecto)
cat > .env << EOF
JWT_SECRET=mi_secreto_local_de_desarrollo
JWT_EXPIRY=8h
DB_DIALECT=sqlite
SQLITE_STORAGE=database.sqlite
ADMIN_EMAIL=admin@techstore.com
ADMIN_PASSWORD=Admin123!
EOF

# Iniciar con hot reload
npm run dev
```

El servidor inicia en `http://localhost:4000` usando **SQLite** automáticamente (no necesita configuración de base de datos).

### Iniciar el Frontend

```bash
# En otra terminal, desde la carpeta client/
cd client
npm install
npm run dev
```

El frontend inicia en `http://localhost:5173`. El proxy de Vite redirige `/api/*` al backend en el puerto 4000 automáticamente.

### Health Check

```bash
curl http://localhost:4000/health
# {"ok":true}
```

---

## 12. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# ─── Servidor ────────────────────────────────────────────────────
PORT=4000
NODE_ENV=development

# ─── JWT ─────────────────────────────────────────────────────────
# ⚠️  Cambiar por un secreto largo y aleatorio en producción
JWT_SECRET=cambia_esto_en_produccion
JWT_EXPIRY=1h

# ─── Base de Datos (SQLite — Desarrollo) ─────────────────────────
DB_DIALECT=sqlite
SQLITE_STORAGE=database.sqlite

# ─── Base de Datos (PostgreSQL — Producción) ─────────────────────
# DB_DIALECT=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=techstore
# DB_USER=techstore_user
# DB_PASSWORD=techstore_pass

# ─── Usuario Administrador Inicial ───────────────────────────────
ADMIN_EMAIL=admin@techstore.com
ADMIN_PASSWORD=Admin123!
```

### Tabla de Variables

| Variable | Requerida | Default | Descripción |
|----------|:---------:|---------|-------------|
| `PORT` | No | `4000` | Puerto del servidor Express |
| `NODE_ENV` | No | `development` | Entorno de ejecución |
| `JWT_SECRET` | **Sí** | — | Secreto para firmar/verificar JWT |
| `JWT_EXPIRY` | No | `1h` | Tiempo de expiración del token |
| `DB_DIALECT` | No | `sqlite` | Motor de BD: `sqlite` o `postgres` |
| `SQLITE_STORAGE` | No | `database.sqlite` | Ruta del archivo SQLite |
| `DB_HOST` | Solo PostgreSQL | — | Host del servidor PostgreSQL |
| `DB_PORT` | Solo PostgreSQL | `5432` | Puerto de PostgreSQL |
| `DB_NAME` | Solo PostgreSQL | — | Nombre de la base de datos |
| `DB_USER` | Solo PostgreSQL | — | Usuario de PostgreSQL |
| `DB_PASSWORD` | Solo PostgreSQL | — | Contraseña de PostgreSQL |
| `ADMIN_EMAIL` | No | `admin@techstore.com` | Email del admin inicial |
| `ADMIN_PASSWORD` | No | `Admin123!` | Contraseña del admin inicial |

---

## 13. Usuarios de Prueba

Ver [USUARIOS_PRUEBA.md](./USUARIOS_PRUEBA.md) para credenciales completas y escenarios de prueba por rol.

### Resumen de Credenciales

| Email | Contraseña | Rol | Tienda |
|-------|-----------|-----|--------|
| `admin@techstore.com` | `Admin123!` | Administrador | — |
| `gerente@techstore.com` | `Gerente123!` | Gerente | Lima |
| `gerente.arequipa@techstore.com` | `Gerente123!` | Gerente | Arequipa |
| `empleado@techstore.com` | `Empleado123!` | Empleado | Lima |
| `empleado.cusco@techstore.com` | `Empleado123!` | Empleado | Cusco |
| `auditor@techstore.com` | `Auditor123!` | Auditor | Oficina Central |

---

## 14. Notas de Seguridad

### Medidas Implementadas

| Medida | Implementación |
|--------|---------------|
| **Hash de contraseñas** | bcrypt con salt rounds 10 |
| **JWT firmado** | HS256 con secreto configurable |
| **Bloqueo de cuenta** | 5 intentos fallidos → bloqueo 15 min |
| **MFA TOTP** | speakeasy, ventana de ±30 segundos |
| **Bloqueo MFA** | 3 intentos fallidos → bloqueo 15 min |
| **RBAC** | Middleware verifica rol en cada endpoint |
| **ABAC** | Motor de políticas evalúa atributos del recurso |
| **Auditoría** | Registro de todas las acciones con IP y timestamp |
| **Validación de entrada** | Verificación de tipos y campos requeridos |

### Recomendaciones para Producción

```
⚠️  ANTES DE DESPLEGAR EN PRODUCCIÓN:
```

- **Cambiar `JWT_SECRET`** por un valor aleatorio de al menos 64 caracteres
- **Forzar HTTPS** con TLS en el servidor o balanceador de carga
- **No usar** el `JWT_SECRET` de desarrollo en producción
- **Configurar CORS** para permitir solo orígenes conocidos
- **Agregar rate limiting** con `express-rate-limit` en endpoints públicos
- **Usar variables de entorno externas** (AWS Secrets Manager, HashiCorp Vault)
- **Implementar códigos de recuperación** para usuarios con MFA bloqueado
- **Configurar backups** de la base de datos PostgreSQL
- **Monitorear** intentos de login y bloqueos con alertas automáticas

---

## Referencias y Documentación Adicional

| Documento | Descripción |
|----------|-------------|
| [DOCKER_SETUP.md](./DOCKER_SETUP.md) | Guía completa de Docker: comandos, troubleshooting, BD |
| [USUARIOS_PRUEBA.md](./USUARIOS_PRUEBA.md) | Credenciales y escenarios de prueba para cada rol |
| [GUIA_MEJORAS.md](./GUIA_MEJORAS.md) | Documentación de mejoras implementadas |
| [MEJORAS_FUTURAS.md](./MEJORAS_FUTURAS.md) | Roadmap y sugerencias de mejoras |
| [client/README.md](./client/README.md) | Documentación completa del frontend |
| [src/README.md](./src/README.md) | Documentación de la API y el backend |
| [Swagger UI](http://localhost:4000/api-docs) | Documentación interactiva de la API |

---

<div align="center">
  Proyecto de Laboratorio — Diseño y Seguridad de Aplicaciones (DSN) — 2026
</div>
