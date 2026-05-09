# TechStore — Frontend (React + Vite)

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.6-5A29E4?style=flat&logo=axios&logoColor=white)

> Interfaz web del sistema TechStore construida con React 18 y Vite. Implementa autenticación con JWT y MFA, navegación protegida por rol y un CRUD completo de productos con validaciones ABAC.

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Stack y Dependencias](#2-stack-y-dependencias)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Páginas y Rutas](#4-páginas-y-rutas)
5. [Componentes Principales](#5-componentes-principales)
6. [Flujo de Autenticación en el Frontend](#6-flujo-de-autenticación-en-el-frontend)
7. [Instalación y Ejecución](#7-instalación-y-ejecución)
8. [Configuración del Proxy Vite](#8-configuración-del-proxy-vite)
9. [Variables de Entorno](#9-variables-de-entorno)
10. [Construcción para Producción](#10-construcción-para-producción)

---

## 1. Descripción General

El frontend de TechStore es una **Single Page Application (SPA)** que se comunica con el backend a través de la API REST en `/api/*`. La aplicación gestiona el estado de autenticación mediante JWT almacenado en `localStorage` y renderiza vistas distintas según el rol del usuario autenticado.

### Características Clave

- **Autenticación completa**: login con email/contraseña + verificación MFA (TOTP)
- **Rutas protegidas**: redirección automática a `/login` si no hay JWT válido
- **Navegación por rol**: Admin ve Usuarios y Roles; Empleado solo ve Productos
- **CRUD de productos**: creación, edición y eliminación con validaciones según ABAC
- **Dashboard**: estadísticas en tiempo real de usuarios, productos y roles
- **Logs de auditoría**: tabla con el historial de acciones del sistema
- **Diseño responsive**: funciona en móvil, tablet y escritorio

---

## 2. Stack y Dependencias

| Paquete | Versión | Uso |
|---------|---------|-----|
| `react` | 18.2 | Biblioteca UI |
| `react-dom` | 18.2 | Renderizado en el DOM |
| `vite` | 5.0 | Dev server + bundler |
| `axios` | 1.6 | Cliente HTTP para la API |
| `qrcode` | 1.5 | Generar QR para configurar MFA |

---

## 3. Estructura del Proyecto

```
client/
├── index.html                  # HTML raíz (mount point: #root)
├── vite.config.js              # Config Vite + proxy /api → backend
├── package.json                # Dependencias y scripts
├── Dockerfile                  # Imagen Docker para producción
└── src/
    ├── main.jsx                # Punto de entrada React DOM
    ├── App.jsx                 # Router con todas las rutas
    ├── styles.css              # Estilos globales (variables CSS, reset)
    │
    ├── components/
    │   ├── Layout.jsx          # Shell con navbar lateral y área de contenido
    │   ├── MFAModal.jsx        # Modal para activar MFA (muestra QR + secret)
    │   └── ProtectedRoute.jsx  # Wrapper que verifica JWT antes de renderizar
    │
    └── pages/
        ├── Login.jsx           # Formulario de login (email + contraseña)
        ├── MFA.jsx             # Input de código TOTP de 6 dígitos
        ├── Dashboard.jsx       # Panel con contadores de usuarios/roles/productos
        ├── Products.jsx        # Tabla CRUD de productos con filtros ABAC
        ├── Users.jsx           # Gestión de usuarios (solo Admin)
        ├── Roles.jsx           # Gestión de roles (solo Admin)
        └── AuditLogs.jsx       # Tabla de logs de auditoría
```

---

## 4. Páginas y Rutas

### Mapa de Rutas

```
/login          → Login.jsx          (pública)
/mfa            → MFA.jsx            (con token temporal)
/dashboard      → Dashboard.jsx      (protegida)
/products       → Products.jsx       (protegida)
/users          → Users.jsx          (protegida — solo Admin)
/roles          → Roles.jsx          (protegida — solo Admin)
/audit-logs     → AuditLogs.jsx      (protegida — Admin y Auditor)
```

### Acceso por Rol

```
                    Admin  Gerente  Empleado  Auditor
/dashboard            ✅      ✅       ✅       ✅
/products             ✅      ✅       ✅       ✅
/users                ✅      ❌       ❌       ❌
/roles                ✅      ❌       ❌       ❌
/audit-logs           ✅      ❌       ❌       ✅
```

### Descripción de Páginas

| Página | Descripción |
|--------|-------------|
| **Login** | Formulario con validación de email y contraseña. Maneja respuesta con `mfa_required: true` y redirige a `/mfa` |
| **MFA** | Input de 6 dígitos para verificar el código TOTP. Muestra intentos restantes y mensajes de bloqueo |
| **Dashboard** | Cards con estadísticas: total de usuarios, productos, roles y últimas acciones |
| **Products** | Tabla con todos los productos visibles para el usuario. CRUD según permisos ABAC del rol |
| **Users** | Lista de usuarios con sus roles. Admin puede crear, editar, desactivar y asignar roles |
| **Roles** | CRUD de roles del sistema. Admin puede crear y eliminar (si no tienen usuarios asignados) |
| **AuditLogs** | Tabla paginada de eventos de auditoría con filtros por usuario, acción y fecha |

---

## 5. Componentes Principales

### `ProtectedRoute.jsx`

Wrapper que verifica la presencia de un JWT válido en `localStorage`. Si no hay token, redirige a `/login`.

```jsx
// Uso en App.jsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### `Layout.jsx`

Shell de la aplicación. Renderiza la barra de navegación lateral con los links disponibles según el rol del usuario decodificado del JWT. Incluye botón de logout que limpia el token y redirige a `/login`.

```
┌─────────────────────────────────────────┐
│  TechStore                     [Logout] │
├────────────┬────────────────────────────┤
│ Dashboard  │                            │
│ Productos  │    <contenido de la página>│
│ Usuarios * │                            │
│ Roles    * │                            │
│ Auditoría  │                            │
│            │                            │
│ * solo Admin                            │
└────────────┴────────────────────────────┘
```

### `MFAModal.jsx`

Modal que se muestra cuando el usuario habilita MFA desde su perfil. Genera un QR Code usando `qrcode` con la URL TOTP y también muestra el secret en texto plano para ingreso manual.

---

## 6. Flujo de Autenticación en el Frontend

```
Usuario abre la app
       │
       ▼
¿Hay JWT en localStorage?
       │
   No ─┼──▶ Redirige a /login
       │
  Sí ──┼──▶ Accede a la ruta solicitada


En /login:
User ingresa email + contraseña
       │
       ▼
POST /api/auth/login
       │
   mfa_required: true ──▶ Guarda token temporal → Redirige a /mfa
       │
   token (JWT completo) ──▶ Guarda en localStorage → Redirige a /dashboard


En /mfa:
User ingresa código de 6 dígitos
       │
       ▼
POST /api/auth/mfa/verify { token: <temporal>, code }
       │
   Éxito ──▶ Guarda JWT en localStorage → Redirige a /dashboard
       │
   Error ──▶ Muestra "N intentos restantes"
       │
   Bloqueado ──▶ Muestra "MFA bloqueado por 15 minutos"
```

### Almacenamiento del Token

```javascript
// Login exitoso → guardar JWT
localStorage.setItem('token', response.data.token)

// Cada petición autenticada → adjuntar header
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

// Logout → limpiar token
localStorage.removeItem('token')
```

---

## 7. Instalación y Ejecución

### Desarrollo (con backend corriendo)

```bash
# Desde la carpeta client/
cd client

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend quedará disponible en `http://localhost:5173`.

> El proxy de Vite redirige automáticamente `/api/*` al backend en `http://localhost:4000`. Ver [sección de proxy](#8-configuración-del-proxy-vite).

### Con Docker (recomendado)

Para ejecutar todo el sistema (frontend + backend + DB):

```bash
# Desde la raíz del proyecto
docker compose up -d
```

El frontend estará disponible en `http://localhost:5174`.

### Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| Dev | `npm run dev` | Servidor de desarrollo con HMR |
| Build | `npm run build` | Construye para producción en `dist/` |
| Preview | `npm run start` | Preview del build de producción |

---

## 8. Configuración del Proxy Vite

El archivo `vite.config.js` configura un proxy que redirige las peticiones `/api/*` al backend:

```javascript
// client/vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
}
```

Esto permite que el frontend haga peticiones a `/api/auth/login` en desarrollo sin necesidad de configurar CORS, ya que Vite actúa como intermediario.

**En producción (Docker):** El frontend corre en Vite preview y la variable `VITE_API_URL` define la URL del backend.

---

## 9. Variables de Entorno

Las variables de entorno de Vite deben tener el prefijo `VITE_` para ser accesibles en el código del navegador.

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VITE_API_URL` | (proxy local) | URL base del backend en producción |

Crear `.env` dentro de `client/` si es necesario sobrescribir:

```env
VITE_API_URL=http://localhost:4000
```

---

## 10. Construcción para Producción

```bash
# Construir la aplicación optimizada
npm run build

# Los archivos estáticos quedan en client/dist/
# Pueden servirse con cualquier servidor web (nginx, caddy, etc.)
```

### Dockerfile del Frontend

```dockerfile
# Imagen de producción usando Vite preview
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

La imagen expone el puerto `5173` y es mapeada al `5174` del host a través de `docker-compose.yml`.

---

## Referencia

| Recurso | URL |
|---------|-----|
| README principal | [../README.md](../README.md) |
| Backend API docs | [../src/README.md](../src/README.md) |
| Docker Setup | [../DOCKER_SETUP.md](../DOCKER_SETUP.md) |
| Swagger UI | http://localhost:4000/api-docs |
| Usuarios de prueba | [../USUARIOS_PRUEBA.md](../USUARIOS_PRUEBA.md) |
