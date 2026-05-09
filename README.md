
# TechStore — Sistema de Gestión de Inventario

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)

> Aplicación web fullstack para gestión de inventario con seguridad avanzada: autenticación MFA (TOTP), control de acceso basado en roles (RBAC), control de acceso basado en atributos (ABAC) y auditoría completa de acciones.

---

## Tabla de Contenidos

1. [Caso de Estudio](#caso-de-estudio)
2. [Características](#características)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Arquitectura del Sistema](#arquitectura-del-sistema)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Modelos de Datos](#modelos-de-datos)
7. [Flujo de Autenticación](#flujo-de-autenticación)
8. [Autorización: RBAC y ABAC](#autorización-rbac-y-abac)
9. [API — Endpoints](#api--endpoints)
10. [Inicio Rápido con Docker](#inicio-rápido-con-docker)
11. [Desarrollo Local](#desarrollo-local)
12. [Variables de Entorno](#variables-de-entorno)
13. [Usuarios de Prueba](#usuarios-de-prueba)
14. [Notas de Seguridad](#notas-de-seguridad)

---

**Contenido del README:**
- Caso de Estudio (planteamiento)
- Descripción general y objetivos
- Características implementadas en este repositorio
- Arquitectura y estructura de carpetas
- Modelos de datos principales
- Autenticación (registro, login, JWT, MFA)
- Autorización (RBAC y ABAC) — reglas y endpoints
- Cómo ejecutar el proyecto (backend + frontend)
- Variables de entorno
- Notas de seguridad y siguientes pasos

--------------------------------------------------

**Caso de Estudio: Sistema de Gestión de Inventario**

TechStore

Contexto del Negocio
TechStore es una cadena de tiendas de tecnología que necesita un sistema centralizado para gestionar su inventario de productos. La empresa tiene diferentes tipos de usuarios con distintos niveles de acceso y responsabilidades.

Objetivo del Proyecto
Desarrollar una aplicación web que implemente controles de seguridad robustos para proteger datos sensibles y operaciones críticas del negocio.

Perfiles de Usuario

Perfil — Responsabilidades
- Administrador del Sistema: Gestiona usuarios y roles, configuración completa del sistema, acceso total a todas las funcionalidades
- Gerente de Tienda: Gestiona productos de su tienda, visualiza reportes de su ubicación, no puede eliminar productos de otras tiendas
- Empleado de Ventas: Consulta productos, actualiza stock en tiempo real, no puede modificar precios
- Auditor: Solo lectura de todos los datos, genera reportes, sin permisos de modificación


Requisitos de Autenticación

Parte 1: Registro e Inicio de Sesión
Funcionalidades requeridas:
- Registro de usuarios: Email (único), Contraseña (mínimo 8 caracteres, mayúscula, número, carácter especial), Nombre completo, Tienda asignada
- Login básico: Validación de credenciales, Generación de token JWT, Manejo de intentos fallidos (bloqueo después de 5 intentos)

Parte 2: Autenticación Multi-Factor (MFA)
Implementar uno de estos métodos:
- Opción A: TOTP (Time-based One-Time Password) — Usar Google Authenticator o similar; código de 6 dígitos cada 30s.
- Opción B: Código por Email — Enviar código de 6 dígitos al email registrado; válido por 5 minutos.

Flujo MFA:
1. Usuario ingresa credenciales correctas
2. Sistema genera y almacena código MFA / o emite token temporal indicando MFA requerido
3. Usuario ingresa código MFA
4. Si es correcto: acceso concedido + token JWT completo
5. Si es incorrecto: máximo 3 intentos


Requisitos de Autorización

PARTE A: RBAC (Role-Based Access Control)
Módulo de Gestión de Roles — CRUD para la tabla `roles` (id, nombre, descripcion, fecha_creacion)

Reglas:
- CREATE: Solo Administrador puede crear roles
- READ: Todos pueden ver roles existentes
- UPDATE: Solo Administrador puede modificar roles
- DELETE: Solo Administrador (no puede eliminar si tiene usuarios asignados)

Usuarios y asignación de roles
- Tabla `usuarios`: id, email, password (hash), nombre_completo, tienda_id, mfa_habilitado, mfa_secret, activo, fecha_creacion
- Tabla `usuario_roles`: id, usuario_id, rol_id, asignado_por, fecha_asignacion

PARTE B: ABAC (Attribute-Based Access Control)
Módulo de Productos — tabla `productos`: id, nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por, fecha_creacion, fecha_actualizacion

Reglas de Acceso por Atributos (resumen):
- SELECT: Admin (todos), Gerente/Empleado (solo su tienda), Auditor (todos, solo lectura)
- INSERT: Admin (cualquier tienda), Gerente (solo su tienda), Empleado (solo productos NO premium en su tienda)
- UPDATE: Admin (todo), Gerente (todo en su tienda excepto `categoria`), Empleado (solo `stock` en su tienda)
- DELETE: Admin (cualquier producto), Gerente (solo NO premium de su tienda), Empleado/Auditor (sin acceso)


Tareas / Fases del proyecto (sugeridas)
- Fase 1 (Autenticación): registro/login, validaciones, MFA, JWT, middleware auth
- Fase 2 (RBAC): CRUD roles/usuarios, asignación roles, middleware roles
- Fase 3 (ABAC): CRUD productos, motor de políticas ABAC, middleware granular, logging/auditoría


Características implementadas en este repositorio
- Backend Node.js + Express con Sequelize (SQLite por defecto para desarrollo)
- Registro, login con bloqueo tras 5 intentos y MFA TOTP con `speakeasy`
- JWT para sesiones y middleware de autenticación
- CRUD roles y usuarios con restricciones (RBAC)
- CRUD productos y motor ABAC básico (reglas aplicadas en middleware)
- Auditoría de acciones en tabla `audit_logs`
- Frontend scaffold en React (Vite) con flujos básicos: login → MFA → listado/CRUD productos


Estructura de carpetas (principales)

```
/
	src/
		controllers/      # Lógica de endpoints
		middlewares/      # auth, rbac, abac
		models/           # definiciones Sequelize
		routes/           # rutas Express
		utils/            # mfa utils, policy-engine, logger
	client/             # scaffold React (Vite)
	package.json        # backend
	client/package.json # frontend
```

Modelos principales (resumen)
- `usuarios` (User): id, email, passwordHash, nombre_completo, tienda_id, mfa_enabled, mfa_secret, activo, fecha_creacion
- `roles` (Role): id, nombre, descripcion, fecha_creacion
- `usuario_roles` (UserRole): id, usuario_id, rol_id, asignado_por, fecha_asignacion
- `productos` (Product): id, nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por, fecha_creacion, fecha_actualizacion
- `audit_logs` (AuditLog): id, usuario_id, action, resource_type, resource_id, details, ip, fecha


API — Endpoints principales

Auth
- `POST /api/auth/register` — Registro de usuario
	- Body: `{ email, password, nombre_completo, tienda_id }`
- `POST /api/auth/login` — Login
	- Body: `{ email, password }` → puede devolver `{ mfa_required: true, token: <temp> }` si MFA habilitado
- `POST /api/auth/mfa/verify` — Verificar código MFA
	- Body: `{ token: <temp>, code }` → devuelve JWT completo
- `POST /api/auth/mfa/enable` — Habilitar MFA (usuario autenticado)

Roles
- `GET /api/roles` — Listar
- `POST /api/roles` — Crear (Admin)
- `PUT /api/roles/:id` — Actualizar (Admin)
- `DELETE /api/roles/:id` — Eliminar (Admin, no si tiene usuarios)

Usuarios
- `GET /api/users/me` — Obtener usuario actual + roles
- `GET /api/users` — Listar (Admin)
- `POST /api/users` — Crear usuario (Admin)
- `PUT /api/users/:id` — Actualizar (Admin)
- `DELETE /api/users/:id` — Eliminar (Admin)
- `POST /api/users/:id/roles` — Asignar rol (Admin)

Productos
- `GET /api/products` — Listar (ABAC: scope por tienda salvo Admin/Auditor)
- `GET /api/products/:id` — Obtener (ABAC)
- `POST /api/products` — Crear (ABAC)
- `PUT /api/products/:id` — Actualizar (ABAC)
- `DELETE /api/products/:id` — Eliminar (ABAC)


Ejecución local (desarrollo)

Backend

1. Instalar dependencias (en la raíz):
```bash
npm install
```
2. Variables de entorno (opcional) — crear un `.env` en la raíz con:
```
JWT_SECRET=supersecreto
JWT_EXPIRY=1h
ADMIN_EMAIL=admin@techstore.com
ADMIN_PASSWORD=Admin123!
```
3. Iniciar servidor:
```bash
npm run dev
```
El servidor correrá por defecto en `http://localhost:4000`.

Frontend

1. Entrar a `client/` e instalar:
```bash
cd client
npm install
npm run dev
```
El cliente Vite servirá la app en `http://localhost:5173` (u otro puerto libre). El proxy de Vite ya está configurado para enviar `/api` a `http://localhost:4000`.


Variables de entorno importantes
- `JWT_SECRET` — secreto para firmar JWT
- `JWT_EXPIRY` — vigencia del JWT (ej. `1h`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — credenciales iniciales para desarrollo


Notas de seguridad y recomendaciones
- Nunca usar la misma `JWT_SECRET` en producción; almacenarla en un gestor de secretos.
- Forzar HTTPS y `Secure` cookies en producción.
- Limitar intentos de login y notificar administradores en bloqueos sospechosos.
- Almacenar y rotar claves MFA con cuidado; considerar respaldo para recuperación de cuentas.
- Validar y sanitizar entradas tanto en cliente como en servidor (ya implementado en varios endpoints).


Tests y validación
- Este repositorio incluye lógica preparada para añadir tests unitarios e2e. Recomendado usar Jest + Supertest para endpoints y Playwright/Cypress para flujos E2E (login, MFA, RBAC, ABAC).


Siguientes pasos sugeridos
- Añadir cobertura de tests automatizados para escenarios críticos.
- Desplegar con base de datos PostgreSQL en staging y configurar variables de entorno.
- Mejorar UX del frontend: modales, manejo de formularios y paginación.
- Integrar envío de email para la opción MFA por email (si se desea).


Contacto y mantenimiento
- Este README y el código sirven como base para el trabajo en equipo. Si necesitas que genere PRs, tests o despliegue Dockerizado, dime y lo preparo.

--------------------------------------------------

Archivos relevantes:
- Código backend: [src](src)
- Scaffold frontend: [client](client)

