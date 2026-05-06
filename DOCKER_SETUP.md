# ✅ TechStore - Aplicación Dockerizada Completamente

## 🚀 Estado: FUNCIONANDO

Todos los servicios están corriendo exitosamente:

### 📦 Servicios Activos

| Servicio | Estado | Puerto | Contenedor |
|----------|--------|--------|------------|
| **Frontend** | ✅ Running | 5174 | techstore-frontend |
| **Backend API** | ✅ Running | 4000 | techstore-backend |
| **PostgreSQL** | ✅ Healthy | 5433 | techstore-postgres |

---

## 🌐 Accesos

### Frontend
```
http://localhost:5174
```
Interfaz completa con Dashboard, Gestión de Usuarios, Roles y Productos.

### Backend API
```
http://localhost:4000
```

### Swagger UI (Documentación API)
```
http://localhost:4000/api-docs
```
Documentación interactiva de todos los endpoints.

### PostgreSQL
```
Host: localhost
Puerto: 5433
Base de datos: techstore
Usuario: techstore_user
Contraseña: techstore_pass
```

---

## 👤 Usuario Inicial

**Email:** `admin@techstore.com`  
**Contraseña:** `Admin123!`  
**Rol:** Administrador (acceso completo)

---

## 🎯 Cómo Usar

### Iniciar los Servicios
```bash
docker-compose up -d
```

### Ver Logs
```bash
# Todos los servicios
docker-compose logs -f

# Un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Detener los Servicios
```bash
docker-compose down
```

### Reiniciar un Servicio
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Ver Estado de los Servicios
```bash
docker-compose ps
```

---

## 📋 Funcionalidades Implementadas

### Backend
- ✅ Autenticación JWT
- ✅ MFA (Multi-Factor Authentication) con TOTP
- ✅ Contador de intentos MFA (3 intentos, bloqueo de 15 min)
- ✅ RBAC (Role-Based Access Control)
- ✅ ABAC (Attribute-Based Access Control)
- ✅ Swagger UI con documentación completa
- ✅ PostgreSQL como base de datos
- ✅ Auditoría de acciones
- ✅ Manejo de sesiones con bloqueo por intentos fallidos

### Frontend
- ✅ Dashboard con estadísticas
- ✅ Gestión de Productos (CRUD completo)
- ✅ Gestión de Usuarios (Solo Admin)
- ✅ Gestión de Roles (Solo Admin)
- ✅ Login + MFA
- ✅ Navegación por roles
- ✅ Diseño profesional y responsive

### Base de Datos
- ✅ PostgreSQL 15
- ✅ Migración automática con Sequelize
- ✅ Seed de datos iniciales (roles y usuario admin)
- ✅ Healthcheck configurado
- ✅ Volumen persistente para datos

---

## 🏗️ Arquitectura Docker

```
┌─────────────────────────────────────────────┐
│  docker-compose (Red: techstore-network)    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐    ┌──────────────┐       │
│  │  Frontend   │───▶│   Backend    │       │
│  │  (Vite)     │    │   (Express)  │       │
│  │  Port: 5174 │    │  Port: 4000  │       │
│  └─────────────┘    └───────┬──────┘       │
│                             │               │
│                             ▼               │
│                     ┌──────────────┐        │
│                     │  PostgreSQL  │        │
│                     │  Port: 5433  │        │
│                     └──────────────┘        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🧪 Probar la Aplicación

1. **Abrir Frontend**: http://localhost:5174
2. **Login** con `admin@techstore.com` / `Admin123!`
3. **Explorar Dashboard** con estadísticas
4. **Gestionar Usuarios** (crear, asignar roles, activar/desactivar)
5. **Gestionar Roles** (crear, editar, eliminar)
6. **Gestionar Productos** con validaciones ABAC
7. **Ver Swagger UI**: http://localhost:4000/api-docs

---

## 🔧 Comandos Útiles

### Acceder a la Base de Datos
```bash
docker exec -it techstore-postgres psql -U techstore_user -d techstore
```

### Ver Tablas
```sql
\dt
```

### Ver Usuarios
```sql
SELECT * FROM usuarios;
```

### Ver Roles
```sql
SELECT * FROM roles;
```

### Ver Logs de Auditoría
```sql
SELECT * FROM audit_logs ORDER BY fecha DESC LIMIT 10;
```

### Reconstruir Todo
```bash
docker-compose down -v  # Eliminar volúmenes
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Políticas ABAC Implementadas

### Productos

| Acción | Admin | Gerente | Empleado | Auditor |
|--------|-------|---------|----------|---------|
| **SELECT** | Todos | Su tienda | Su tienda | Todos (solo lectura) |
| **INSERT** | Cualquier tienda | Su tienda | Su tienda (NO premium) | ❌ |
| **UPDATE** | Todos los campos | Todos excepto `categoria` | Solo `stock` | ❌ |
| **DELETE** | Cualquier producto | Solo NO premium | ❌ | ❌ |

### Roles

| Acción | Admin | Otros |
|--------|-------|-------|
| **CREATE** | ✅ | ❌ |
| **READ** | ✅ | ✅ |
| **UPDATE** | ✅ | ❌ |
| **DELETE** | ✅ (si no tiene usuarios) | ❌ |

### Usuarios

| Acción | Admin | Otros |
|--------|-------|-------|
| **CREATE** | ✅ | ❌ |
| **READ** | ✅ Todos | ✅ Solo su perfil |
| **UPDATE** | ✅ | ❌ |
| **DELETE** | ✅ | ❌ |
| **Asignar Roles** | ✅ | ❌ |

---

## 🐛 Troubleshooting

### Error: Puerto ocupado
```bash
# Cambiar puerto en docker-compose.yml
# Frontend: 5174 (actual)
# Backend: 4000 (actual)
# PostgreSQL: 5433 (actual)
```

### Error: Contenedor no inicia
```bash
docker-compose logs <servicio>
docker-compose restart <servicio>
```

### Error: Base de datos no responde
```bash
docker-compose restart postgres
docker-compose logs postgres
```

### Limpiar todo y empezar de cero
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build -d
```

---

## 📝 Archivos Importantes

- `docker-compose.yml` - Orquestación de servicios
- `Dockerfile` (raíz) - Imagen del backend
- `client/Dockerfile` - Imagen del frontend
- `.dockerignore` - Archivos excluidos del build
- `client/.dockerignore` - Archivos excluidos del frontend
- `.env.example` - Plantilla de variables de entorno

---

## 🎉 ¡Felicitaciones!

Tu aplicación TechStore está completamente dockerizada y funcionando con:
- ✅ Backend Node.js + Express
- ✅ Frontend React + Vite
- ✅ Base de datos PostgreSQL
- ✅ Hot reload en desarrollo (nodemon + Vite)
- ✅ Documentación API con Swagger
- ✅ Seguridad avanzada (JWT, MFA, RBAC, ABAC)

**Fecha de implementación:** 6 de mayo de 2026  
**Estado:** ✅ Producción-ready
