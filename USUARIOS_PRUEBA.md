# 🔐 Usuarios de Prueba - TechStore

## Acceso al Sistema
**URL Frontend:** http://localhost:5174
**URL API:** http://localhost:4000
**URL Swagger:** http://localhost:4000/api-docs

---

## 👑 ROL ADMIN
Acceso completo al sistema: usuarios, roles, productos, auditoría

| Email | Contraseña | Tienda | Descripción |
|-------|-----------|---------|-------------|
| admin@techstore.com | `Admin123!` | - | Administrador principal |

**Permisos:**
- ✅ Gestión completa de usuarios
- ✅ Gestión completa de roles
- ✅ CRUD completo de productos (sin restricciones)
- ✅ Ver auditoría del sistema

---

## 👔 ROL GERENTE
Gestión de productos en su tienda

| Email | Contraseña | Tienda | Descripción |
|-------|-----------|---------|-------------|
| gerente@techstore.com | `Gerente123!` | Lima | Gerente tienda Lima |
| gerente.arequipa@techstore.com | `Gerente123!` | Arequipa | Gerente tienda Arequipa |

**Permisos (ABAC):**
- ✅ Crear productos en su tienda
- ✅ Actualizar productos de su tienda
- ✅ Eliminar productos NO premium de su tienda
- ❌ No puede eliminar productos premium
- ❌ No puede modificar la categoría de productos

---

## 🛒 ROL EMPLEADO
Actualización de stock únicamente

| Email | Contraseña | Tienda | Descripción |
|-------|-----------|---------|-------------|
| empleado@techstore.com | `Empleado123!` | Lima | Empleado tienda Lima |
| empleado.cusco@techstore.com | `Empleado123!` | Cusco | Empleado tienda Cusco |

**Permisos (ABAC):**
- ✅ Actualizar stock de productos
- ❌ No puede crear productos
- ❌ No puede eliminar productos
- ❌ No puede crear productos premium
- ❌ Solo lectura en otros campos

---

## 📋 ROL AUDITOR
Solo lectura + acceso a auditoría

| Email | Contraseña | Tienda | Descripción |
|-------|-----------|---------|-------------|
| auditor@techstore.com | `Auditor123!` | Oficina Central | Auditor principal |
| auditor.sistemas@techstore.com | `Auditor123!` | Oficina Central | Auditor de sistemas |

**Permisos:**
- ✅ Ver dashboard (solo lectura)
- ✅ Ver página de auditoría
- ❌ No puede modificar nada
- ❌ No puede acceder a gestión de usuarios/roles

---

## 🧪 Pruebas RBAC/ABAC Sugeridas

### Test 1: Admin
1. Login como `admin@techstore.com`
2. Verificar acceso a Usuarios, Roles, Productos
3. Crear un producto premium en cualquier tienda

### Test 2: Gerente
1. Login como `gerente@techstore.com`
2. Verificar que solo ve Dashboard y Productos
3. Crear un producto en Lima (debe funcionar)
4. Intentar crear producto premium (debe fallar)
5. Intentar eliminar producto premium (debe fallar)

### Test 3: Empleado
1. Login como `empleado@techstore.com`
2. Solo puede actualizar stock de productos
3. No puede crear ni eliminar

### Test 4: Auditor
1. Login como `auditor@techstore.com`
2. Acceso a Dashboard (solo lectura)
3. Acceso a página de Auditoría
4. No puede modificar nada

---

## 🔒 Seguridad MFA

Para habilitar MFA en cualquier usuario:
1. Login como Admin
2. Ir a Usuarios
3. Hacer clic en el usuario
4. Habilitar MFA

**Nota:** El sistema bloqueará después de 3 intentos fallidos de MFA por 15 minutos.

---

## 📊 Logs de Auditoría

Todos los eventos se registran en la tabla `audit_logs`:
- ✅ Login exitoso/fallido
- ✅ Registro de usuarios
- ✅ Creación/actualización/eliminación de usuarios
- ✅ Asignación de roles
- ✅ CRUD de productos
- ✅ Eventos MFA (habilitación, verificación, bloqueos)
- ✅ Cambios en roles

Para ver los logs reales, se necesita implementar el endpoint `GET /api/audit-logs` en el backend.

---

## 🐳 Comandos Docker

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs del backend
docker-compose logs -f backend

# Ver logs del frontend
docker-compose logs -f frontend

# Reiniciar todos los servicios
docker-compose restart

# Detener todos los servicios
docker-compose down

# Ver datos en PostgreSQL
docker exec techstore-postgres psql -U techstore_user -d techstore -c "SELECT * FROM usuarios;"
docker exec techstore-postgres psql -U techstore_user -d techstore -c "SELECT * FROM usuario_roles ur JOIN roles r ON ur.rol_id = r.id;"
```

---

**Fecha de creación:** 6 de mayo de 2026
**Proyecto:** DSN-lab08 - TechStore Inventory System
