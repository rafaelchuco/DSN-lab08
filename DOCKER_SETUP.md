# TechStore — Guía Completa de Docker

![Docker](https://img.shields.io/badge/Docker-20.10+-2496ED?style=flat&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-v2-2496ED?style=flat&logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)

> Guía completa para ejecutar, gestionar y depurar la aplicación TechStore usando Docker y Docker Compose.

---

## Tabla de Contenidos

1. [Requisitos](#1-requisitos)
2. [Servicios y Arquitectura](#2-servicios-y-arquitectura)
3. [Inicio Rápido](#3-inicio-rápido)
4. [URLs y Accesos](#4-urls-y-accesos)
5. [Comandos de Gestión](#5-comandos-de-gestión)
6. [Gestión de la Base de Datos](#6-gestión-de-la-base-de-datos)
7. [Políticas ABAC en la BD](#7-políticas-abac-en-la-bd)
8. [Reconstrucción y Actualización](#8-reconstrucción-y-actualización)
9. [Solución de Problemas](#9-solución-de-problemas)
10. [Configuración Docker Compose](#10-configuración-docker-compose)

---

## 1. Requisitos

| Requisito | Versión mínima | Verificación |
|-----------|---------------|-------------|
| Docker Engine | 20.10+ | `docker --version` |
| Docker Compose | v2+ | `docker compose version` |
| Memoria RAM libre | 512 MB+ | — |
| Espacio en disco | 2 GB+ | — |

### Instalación de Docker

- **macOS**: [Docker Desktop para Mac](https://docs.docker.com/desktop/mac/install/)
- **Windows**: [Docker Desktop para Windows](https://docs.docker.com/desktop/windows/install/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

---

## 2. Servicios y Arquitectura

### Servicios Definidos

| Servicio | Imagen | Puerto Host | Puerto Contenedor | Descripción |
|---------|--------|:-----------:|:-----------------:|-------------|
| `postgres` | postgres:15-alpine | 5433 | 5432 | Base de datos PostgreSQL |
| `backend` | Dockerfile (raíz) | 4000 | 4000 | API Node.js + Express |
| `frontend` | client/Dockerfile | 5174 | 5173 | React + Vite |

### Diagrama de Red

```
                    HOST (tu máquina)
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     :5174│          :4000│          :5433│
          ▼               ▼               ▼
┌─────────────────────────────────────────────────────┐
│              techstore-network (bridge)             │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │  frontend    │  │   backend    │  │ postgres │  │
│  │  :5173       │─▶│   :4000      │─▶│  :5432   │  │
│  └──────────────┘  └──────────────┘  └──────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Orden de Inicio (dependencias)

```
postgres (healthcheck: pg_isready)
    │
    ▼ (cuando postgres está healthy)
backend (depende de postgres)
    │
    ▼ (cuando backend está arriba)
frontend (depende de backend)
```

---

## 3. Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd DSN-lab08

# 2. Levantar todos los servicios
docker compose up -d

# 3. Ver el estado
docker compose ps
```

**Salida esperada después de ~30 segundos:**

```
NAME                   IMAGE                STATUS          PORTS
techstore-postgres     postgres:15-alpine   Up (healthy)    0.0.0.0:5433->5432/tcp
techstore-backend      dsn-lab08-backend    Up              0.0.0.0:4000->4000/tcp
techstore-frontend     dsn-lab08-frontend   Up              0.0.0.0:5174->5173/tcp
```

### Verificar que todo funciona

```bash
# Health check del backend
curl http://localhost:4000/health
# Esperado: {"ok":true}

# Ver Swagger UI
open http://localhost:4000/api-docs

# Abrir el frontend
open http://localhost:5174
```

---

## 4. URLs y Accesos

### Servicios Web

| Servicio | URL | Descripción |
|---------|-----|-------------|
| **Frontend** | http://localhost:5174 | Interfaz web completa |
| **API Backend** | http://localhost:4000 | API REST |
| **Swagger UI** | http://localhost:4000/api-docs | Documentación interactiva |
| **Health Check** | http://localhost:4000/health | Estado del servidor |

### Base de Datos PostgreSQL

```
Host:     localhost
Puerto:   5433
Base de datos: techstore
Usuario:  techstore_user
Contraseña: techstore_pass
```

**Cadena de conexión:**
```
postgresql://techstore_user:techstore_pass@localhost:5433/techstore
```

### Credenciales Iniciales del Sistema

| Campo | Valor |
|-------|-------|
| **Email** | `admin@techstore.com` |
| **Contraseña** | `Admin123!` |
| **Rol** | Administrador |

---

## 5. Comandos de Gestión

### Ciclo de Vida de los Servicios

```bash
# Iniciar todos los servicios (en segundo plano)
docker compose up -d

# Iniciar con logs visibles (foreground)
docker compose up

# Detener todos los servicios (preserva datos)
docker compose down

# Detener y eliminar volúmenes (RESET COMPLETO de BD)
docker compose down -v

# Reiniciar todos los servicios
docker compose restart

# Reiniciar un servicio específico
docker compose restart backend
docker compose restart frontend
docker compose restart postgres
```

### Ver Estado

```bash
# Estado de todos los contenedores
docker compose ps

# Estado detallado con recursos usados
docker stats

# Ver procesos dentro de un contenedor
docker compose top backend
```

### Logs

```bash
# Logs de todos los servicios (últimas 100 líneas)
docker compose logs --tail=100

# Logs en tiempo real (streaming)
docker compose logs -f

# Logs de un servicio específico en tiempo real
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Logs desde una fecha específica
docker compose logs --since="2026-05-08T10:00:00"
```

---

## 6. Gestión de la Base de Datos

### Conectar a PostgreSQL

```bash
# Abrir consola psql dentro del contenedor
docker exec -it techstore-postgres psql -U techstore_user -d techstore
```

### Consultas de Diagnóstico

```sql
-- Ver todas las tablas
\dt

-- Ver estructura de una tabla
\d usuarios
\d productos
\d audit_logs

-- Listar usuarios del sistema
SELECT id, email, nombre_completo, tienda_id, activo, fecha_creacion
FROM usuarios
ORDER BY fecha_creacion;

-- Ver roles disponibles
SELECT id, nombre, descripcion FROM roles;

-- Ver asignaciones de roles
SELECT u.email, r.nombre as rol, ur.fecha_asignacion
FROM usuario_roles ur
JOIN usuarios u ON u.id = ur.usuario_id
JOIN roles r ON r.id = ur.rol_id
ORDER BY ur.fecha_asignacion DESC;

-- Ver productos con su tienda
SELECT nombre, precio, stock, tienda_id, es_premium, categoria
FROM productos
ORDER BY tienda_id, nombre;

-- Ver últimas acciones de auditoría
SELECT
  u.email,
  al.action,
  al.resource_type,
  al.resource_id,
  al.ip,
  al.fecha
FROM audit_logs al
LEFT JOIN usuarios u ON u.id = al.usuario_id
ORDER BY al.fecha DESC
LIMIT 20;

-- Contar registros por tabla
SELECT
  (SELECT COUNT(*) FROM usuarios) as total_usuarios,
  (SELECT COUNT(*) FROM roles) as total_roles,
  (SELECT COUNT(*) FROM productos) as total_productos,
  (SELECT COUNT(*) FROM audit_logs) as total_logs;
```

### Backup y Restore

```bash
# Crear backup completo de la BD
docker exec techstore-postgres pg_dump -U techstore_user techstore > backup_$(date +%Y%m%d).sql

# Restaurar desde backup
cat backup_20260508.sql | docker exec -i techstore-postgres psql -U techstore_user -d techstore

# Backup en formato comprimido
docker exec techstore-postgres pg_dump -U techstore_user -Fc techstore > backup.dump

# Restore desde dump comprimido
docker exec -i techstore-postgres pg_restore -U techstore_user -d techstore < backup.dump
```

---

## 7. Políticas ABAC en la BD

Las políticas ABAC se verifican a nivel de aplicación, pero puedes consultarlas directamente en la BD:

### Verificar Restricciones por Tienda

```sql
-- Productos por tienda
SELECT tienda_id, COUNT(*) as total, SUM(stock) as stock_total
FROM productos
GROUP BY tienda_id;

-- Usuarios por tienda
SELECT tienda_id, COUNT(*) as total
FROM usuarios
GROUP BY tienda_id;

-- Productos premium (solo Admin puede eliminar)
SELECT nombre, tienda_id, precio
FROM productos
WHERE es_premium = true;
```

### Ver Historial de Accesos Denegados

```sql
-- Intentos rechazados por ABAC/RBAC (registrados en auditoría)
SELECT u.email, al.action, al.details, al.fecha
FROM audit_logs al
JOIN usuarios u ON u.id = al.usuario_id
WHERE al.details::text LIKE '%denied%'
   OR al.details::text LIKE '%forbidden%'
ORDER BY al.fecha DESC;
```

---

## 8. Reconstrucción y Actualización

### Después de Cambios en el Código

```bash
# Reconstruir solo el backend (cambios en src/)
docker compose build backend
docker compose up -d backend

# Reconstruir solo el frontend (cambios en client/)
docker compose build frontend
docker compose up -d frontend

# Reconstruir todo sin caché (limpia completamente)
docker compose build --no-cache
docker compose up -d
```

### Actualizar Dependencias

```bash
# Actualizar dependencias del backend
docker compose exec backend npm install <nuevo-paquete>

# Actualizar dependencias del frontend
docker compose exec frontend npm install <nuevo-paquete>
```

### Reset Completo del Sistema

```bash
# ADVERTENCIA: Esto elimina todos los datos de la BD
docker compose down -v           # Para contenedores y elimina volúmenes
docker compose build --no-cache  # Reconstruye todas las imágenes
docker compose up -d             # Inicia todo de nuevo
```

---

## 9. Solución de Problemas

### El backend no puede conectarse a PostgreSQL

```bash
# Verificar que postgres esté healthy
docker compose ps postgres
# Debe mostrar: Up (healthy)

# Ver logs de postgres
docker compose logs postgres

# Esperar a que el healthcheck pase (puede tardar ~30s)
docker compose up --wait
```

### El frontend no carga / Error de CORS

```bash
# Verificar que el backend esté corriendo
curl http://localhost:4000/health

# Ver logs del frontend para errores de build
docker compose logs frontend

# Reiniciar el frontend
docker compose restart frontend
```

### Puerto ya en uso

```bash
# Error: "bind: address already in use"
# Verificar qué proceso usa el puerto
lsof -i :5174   # macOS/Linux
lsof -i :4000
lsof -i :5433

# Matar el proceso
kill -9 <PID>

# O cambiar el puerto en docker-compose.yml:
# ports:
#   - "5175:5173"  # Cambiar puerto del host
```

### Contenedor reiniciando en loop (CrashLoopBackOff)

```bash
# Ver los últimos logs del contenedor problemático
docker compose logs --tail=50 backend

# Errores comunes:
# - "Cannot find module" → falta npm install, reconstruir imagen
# - "ECONNREFUSED postgres" → postgres aún no está healthy
# - "JWT_SECRET undefined" → verificar variables de entorno
```

### Limpiar todo Docker (último recurso)

```bash
# Eliminar todos los contenedores, redes y volúmenes de este proyecto
docker compose down -v --remove-orphans

# Eliminar imágenes construidas localmente
docker rmi dsn-lab08-backend dsn-lab08-frontend

# Limpiar sistema Docker completo (¡afecta otros proyectos!)
docker system prune -a --volumes
```

---

## 10. Configuración Docker Compose

El archivo `docker-compose.yml` define los tres servicios:

```yaml
version: '3.8'

services:
  # Base de datos PostgreSQL
  postgres:
    image: postgres:15-alpine        # Imagen oficial ligera
    container_name: techstore-postgres
    environment:
      POSTGRES_DB: techstore
      POSTGRES_USER: techstore_user
      POSTGRES_PASSWORD: techstore_pass
    ports:
      - "5433:5432"                  # Puerto 5433 en host (evita conflictos)
    volumes:
      - pgdata:/var/lib/postgresql/data  # Datos persistentes
    healthcheck:                     # Verifica que PostgreSQL esté listo
      test: ["CMD-SHELL", "pg_isready -U techstore_user -d techstore"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend Node.js + Express
  backend:
    build:
      context: .
      dockerfile: Dockerfile         # Dockerfile en la raíz del proyecto
    container_name: techstore-backend
    depends_on:
      postgres:
        condition: service_healthy   # Espera hasta que postgres esté healthy
    environment:
      DB_DIALECT: postgres
      DB_HOST: postgres              # Nombre del servicio = hostname en Docker
      DB_NAME: techstore
      DB_USER: techstore_user
      DB_PASSWORD: techstore_pass
      JWT_SECRET: production_secret_change_me
      NODE_ENV: development
      PORT: 4000
    ports:
      - "4000:4000"
    volumes:
      - ./src:/app/src               # Hot reload del código fuente
    restart: unless-stopped

  # Frontend React + Vite
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: techstore-frontend
    depends_on:
      - backend
    ports:
      - "5174:5173"
    volumes:
      - ./client/src:/app/src        # Hot reload del frontend
      - ./client/index.html:/app/index.html
    restart: unless-stopped

volumes:
  pgdata:                            # Volumen persistente para PostgreSQL

networks:
  techstore-network:
    driver: bridge                   # Red interna entre contenedores
```

### Variables de Entorno Clave en Docker

| Variable | Servicio | Valor | Descripción |
|----------|---------|-------|-------------|
| `DB_HOST` | backend | `postgres` | Hostname interno (nombre del servicio) |
| `DB_DIALECT` | backend | `postgres` | Usa PostgreSQL (no SQLite) |
| `JWT_SECRET` | backend | `production_secret_...` | **Cambiar en producción** |
| `NODE_ENV` | backend | `development` | Entorno de ejecución |

---

## Referencias

| Recurso | URL |
|---------|-----|
| README principal | [README.md](./README.md) |
| Backend API docs | [src/README.md](./src/README.md) |
| Usuarios de prueba | [USUARIOS_PRUEBA.md](./USUARIOS_PRUEBA.md) |
| Docker Docs | https://docs.docker.com |
| PostgreSQL Docs | https://www.postgresql.org/docs/15/
