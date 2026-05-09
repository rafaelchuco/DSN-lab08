# TechStore — Usuarios de Prueba y Escenarios RBAC/ABAC

> Credenciales para probar todos los roles y validar las políticas de acceso implementadas.

## URLs del Sistema

| Servicio | URL |
|---------|-----|
| **Frontend** | http://localhost:5174 |
| **API REST** | http://localhost:4000 |
| **Swagger UI** | http://localhost:4000/api-docs |
| **Health Check** | http://localhost:4000/health |

---

## Credenciales por Rol

### Administrador

**Acceso total al sistema sin restricciones**

| Email | Contraseña | Tienda |
|-------|-----------|--------|
| `admin@techstore.com` | `Admin123!` | — |

**Permisos:**
- Gestión completa de usuarios (CRUD + asignación de roles)
- Gestión completa de roles (CRUD)
- CRUD total de productos en cualquier tienda
- Crear, actualizar y eliminar productos premium
- Ver logs de auditoría del sistema
- Acceso a todas las páginas del frontend

---

### Gerente de Tienda

**Gestión de productos restringida a su tienda**

| Email | Contraseña | Tienda | Descripción |
|-------|-----------|--------|-------------|
| `gerente@techstore.com` | `Gerente123!` | Lima | Gerente tienda Lima |
| `gerente.arequipa@techstore.com` | `Gerente123!` | Arequipa | Gerente tienda Arequipa |

**Permisos (ABAC):**
- Ver productos de su tienda
- Crear productos en su tienda (solo no-premium)
- Actualizar productos de su tienda (excepto campo `categoria`)
- Eliminar productos no-premium de su tienda
- No puede crear ni eliminar productos premium
- No puede gestionar usuarios ni roles
- No puede ver logs de auditoría

---

### Empleado de Ventas

**Solo actualización de stock**

| Email | Contraseña | Tienda | Descripción |
|-------|-----------|--------|-------------|
| `empleado@techstore.com` | `Empleado123!` | Lima | Empleado tienda Lima |
| `empleado.cusco@techstore.com` | `Empleado123!` | Cusco | Empleado tienda Cusco |

**Permisos (ABAC):**
- Ver productos de su tienda (solo lectura)
- Actualizar únicamente el campo `stock` en su tienda
- No puede crear productos
- No puede eliminar productos
- No puede modificar precio, categoría ni nombre
- No puede gestionar usuarios ni roles

---

### Auditor

**Solo lectura de todos los datos**

| Email | Contraseña | Tienda | Descripción |
|-------|-----------|--------|-------------|
| `auditor@techstore.com` | `Auditor123!` | Oficina Central | Auditor principal |
| `auditor.sistemas@techstore.com` | `Auditor123!` | Oficina Central | Auditor de sistemas |

**Permisos:**
- Ver productos de TODAS las tiendas (solo lectura)
- Ver logs de auditoría del sistema
- Ver dashboard con estadísticas
- No puede crear, editar ni eliminar nada
- No puede acceder a gestión de usuarios ni roles

---

## Tabla Resumen de Permisos

```
                        Admin  Gerente  Empleado  Auditor
                          │       │        │        │
PÁGINAS DEL FRONTEND:
  Dashboard               ✅      ✅       ✅       ✅
  Productos               ✅      ✅       ✅       ✅
  Usuarios                ✅      ❌       ❌       ❌
  Roles                   ✅      ❌       ❌       ❌
  Auditoría               ✅      ❌       ❌       ✅

PRODUCTOS — OPERACIONES:
  Ver (su tienda)         ✅      ✅       ✅       ✅
  Ver (todas las tiendas) ✅      ❌       ❌       ✅
  Crear (su tienda)       ✅      ✅       ❌       ❌
  Crear (premium)         ✅      ❌       ❌       ❌
  Editar (su tienda)      ✅      ✅       ❌       ❌
  Editar solo stock       ✅      ✅       ✅       ❌
  Eliminar (no premium)   ✅      ✅       ❌       ❌
  Eliminar (premium)      ✅      ❌       ❌       ❌
```

---

## Escenarios de Prueba Recomendados

### Escenario 1: Flujo de Admin

```
1. Abrir http://localhost:5174
2. Login: admin@techstore.com / Admin123!
3. Verificar acceso a TODAS las páginas del menú lateral
4. Ir a "Usuarios" → Crear un nuevo usuario con tienda "Lima"
5. Ir a "Roles" → Verificar que aparecen los 4 roles
6. Ir a "Productos" → Crear un producto premium para cualquier tienda
7. Editar el producto y cambiar la categoría (debe funcionar)
8. Eliminar el producto premium (debe funcionar)
9. Ir a "Auditoría" → Ver el registro de todas las acciones anteriores
```

**Resultado esperado:** Admin puede realizar todas las operaciones sin restricciones.

---

### Escenario 2: Restricciones del Gerente

```
1. Login: gerente@techstore.com / Gerente123!
2. Verificar que el menú NO muestra "Usuarios" ni "Roles"
3. Ir a "Productos" → Solo debe ver productos de "Lima"
4. Crear un producto en Lima con es_premium = false → DEBE FUNCIONAR
5. Crear un producto con es_premium = true → DEBE FALLAR (403 Forbidden)
6. Editar un producto existente → Cambiar nombre y precio → DEBE FUNCIONAR
7. Editar un producto → Intentar cambiar la categoría → DEBE FALLAR
8. Eliminar un producto no-premium de Lima → DEBE FUNCIONAR
9. Intentar eliminar un producto premium → DEBE FALLAR
```

**Resultado esperado:** El Gerente opera solo en su tienda con restricciones de premium.

---

### Escenario 3: Limitaciones del Empleado

```
1. Login: empleado@techstore.com / Empleado123!
2. Verificar que el menú solo muestra Dashboard y Productos
3. Ir a "Productos" → Solo debe ver productos de "Lima"
4. Intentar crear un producto → Debe recibir error 403
5. Hacer clic en "Editar" en un producto existente
6. Modificar el campo "stock" → DEBE FUNCIONAR
7. Modificar el campo "precio" → DEBE FALLAR
8. Modificar el campo "nombre" → DEBE FALLAR
9. Intentar eliminar un producto → DEBE FALLAR
```

**Resultado esperado:** El Empleado solo puede actualizar el stock.

---

### Escenario 4: Auditor de Solo Lectura

```
1. Login: auditor@techstore.com / Auditor123!
2. Verificar que el menú muestra: Dashboard, Productos, Auditoría
3. Ir a "Productos" → Debe ver productos de TODAS las tiendas
4. Verificar que no hay botones de Crear, Editar ni Eliminar
5. Cualquier intento de modificación debe retornar 403
6. Ir a "Auditoría" → Ver logs de las acciones de los escenarios anteriores
```

**Resultado esperado:** El Auditor tiene acceso de solo lectura en todos los módulos habilitados.

---

### Escenario 5: Prueba de MFA

```
1. Login: admin@techstore.com / Admin123!
2. Ir al perfil y activar MFA
3. Escanear el QR con Google Authenticator
4. Cerrar sesión
5. Login nuevamente → Sistema pide código MFA
6. Ingresar código correcto → Acceso concedido
7. Volver a hacer login e ingresar un código incorrecto
8. Repetir 3 veces → Debe mostrar "MFA bloqueado por 15 minutos"
```

**Resultado esperado:** MFA funciona correctamente con bloqueo tras 3 intentos fallidos.

---

### Escenario 6: Bloqueo de Cuenta por Login

```
1. Intentar login con email válido pero contraseña incorrecta
2. Repetir 5 veces → Debe mostrar mensaje de cuenta bloqueada
3. Esperar 15 minutos o reiniciar el backend
4. Hacer login con credenciales correctas → Acceso concedido
```

**Resultado esperado:** La cuenta se bloquea tras 5 intentos fallidos.

---

### Escenario 7: Aislamiento entre Tiendas

```
1. Login como gerente@techstore.com (Lima)
2. Verificar que SOLO ve productos de Lima
3. Login como gerente.arequipa@techstore.com (Arequipa)
4. Verificar que SOLO ve productos de Arequipa
5. Cada gerente opera de forma completamente independiente
```

**Resultado esperado:** El aislamiento entre tiendas funciona correctamente por ABAC.

---

### Escenario 8: Prueba via Swagger UI

```
1. Abrir http://localhost:4000/api-docs
2. Ejecutar POST /api/auth/login con credenciales de admin
3. Copiar el token de la respuesta
4. Hacer clic en "Authorize" → ingresar "Bearer <token>"
5. Probar GET /api/products → Ver todos los productos
6. Probar POST /api/products → Crear un producto
7. Ahora hacer login como empleado y repetir el POST /api/products
   → Debe retornar 403 Forbidden
```

---

## Probar la API con curl

```bash
# Obtener token de admin
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@techstore.com","password":"Admin123!"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Listar productos (como admin)
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/products

# Crear producto (como admin)
curl -X POST http://localhost:4000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Laptop Gaming Pro",
    "descripcion": "Laptop de alto rendimiento",
    "precio": 2499.99,
    "stock": 10,
    "categoria": "Laptops",
    "tienda_id": "Lima",
    "es_premium": false
  }'

# Listar usuarios (como admin)
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/users

# Listar roles
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/roles
```

---

## Referencia

| Documento | Descripción |
|----------|-------------|
| [README.md](./README.md) | Documentación principal del proyecto |
| [DOCKER_SETUP.md](./DOCKER_SETUP.md) | Guía de Docker y comandos |
| [src/README.md](./src/README.md) | Documentación de la API backend |
| [client/README.md](./client/README.md) | Documentación del frontend |
