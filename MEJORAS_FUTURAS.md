# 📋 Mejoras Futuras - TechStore

Este documento describe las mejoras opcionales recomendadas para expandir y fortalecer el proyecto TechStore. El proyecto actual cumple al 100% con los requisitos del caso de estudio, pero estas mejoras agregarían valor adicional para un entorno de producción.

---

## 1. 🔐 Contador de Intentos MFA

### Descripción
Agregar un límite explícito de 3 intentos para códigos MFA fallidos, bloqueando temporalmente la cuenta después de exceder el límite.

### Estado Actual
- El sistema valida códigos MFA correctamente
- No hay límite explícito de intentos fallidos para MFA
- Los intentos de login sí tienen límite (5 intentos)

### Implementación Sugerida

**Cambios en el modelo User:**
```javascript
// src/models/user.js
mfa_failed_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
mfa_lock_until: { type: DataTypes.DATE, allowNull: true }
```

**Cambios en authController.js:**
```javascript
async function mfaVerify(req, res) {
  const { token, code } = req.body;
  const payload = jwt.verify(token, config.jwtSecret);
  const user = await db.User.findByPk(payload.sub);
  
  // Verificar bloqueo MFA
  if (user.mfa_lock_until && new Date(user.mfa_lock_until) > new Date()) {
    return res.status(423).json({ 
      error: 'MFA bloqueado temporalmente. Intenta más tarde.' 
    });
  }
  
  const ok = verifyTOTP(user.mfa_secret, code);
  
  if (!ok) {
    user.mfa_failed_attempts = (user.mfa_failed_attempts || 0) + 1;
    
    if (user.mfa_failed_attempts >= 3) {
      user.mfa_lock_until = new Date(Date.now() + 15 * 60 * 1000); // 15 min
      await user.save();
      return res.status(423).json({ 
        error: 'Demasiados intentos fallidos. Cuenta MFA bloqueada por 15 minutos.' 
      });
    }
    
    await user.save();
    return res.status(401).json({ 
      error: `Código MFA inválido. ${3 - user.mfa_failed_attempts} intentos restantes.` 
    });
  }
  
  // Reset en caso de éxito
  user.mfa_failed_attempts = 0;
  user.mfa_lock_until = null;
  await user.save();
  
  // Continuar con token completo...
}
```

**Beneficios:**
- ✅ Protección contra ataques de fuerza bruta en MFA
- ✅ Consistencia con el límite de intentos de login
- ✅ Mejora la seguridad general del sistema

**Esfuerzo estimado:** 2-3 horas

---

## 2. 🧪 Tests Automatizados

### Descripción
Implementar suite completa de tests para los 4 escenarios principales del caso de estudio y cobertura adicional.

### Estado Actual
- No hay tests automatizados implementados
- La aplicación ha sido probada manualmente

### Implementación Sugerida

**Dependencias a agregar:**
```json
{
  "devDependencies": {
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.0"
  }
}
```

**Estructura de tests:**
```
/tests
  /unit
    - auth.test.js
    - rbac.test.js
    - abac.test.js
    - policy-engine.test.js
  /integration
    - login-mfa.test.js
    - roles-crud.test.js
    - products-crud.test.js
    - scenarios.test.js
```

**Ejemplo: tests/integration/scenarios.test.js**
```javascript
const request = require('supertest');
const app = require('../src/server');
const db = require('../src/models');

describe('Escenarios del Caso de Estudio', () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    // Seed test data
  });

  describe('Escenario 1: Login con MFA', () => {
    test('Usuario con credenciales correctas solicita código MFA', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'gerente@techstore.com', password: 'Test1234!' });
      
      expect(res.status).toBe(200);
      expect(res.body.mfa_required).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    test('Código MFA correcto otorga acceso completo', async () => {
      // ... implementación
    });
  });

  describe('Escenario 2: RBAC - Intento no autorizado', () => {
    test('Empleado no puede crear roles', async () => {
      const token = await getTokenForRole('Empleado');
      const res = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'NuevoRol', descripcion: 'Test' });
      
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Admin');
    });
  });

  describe('Escenario 3: ABAC - Gerente modifica producto', () => {
    test('Gerente puede modificar precio de producto en su tienda', async () => {
      const token = await getTokenForUser('gerente_lima@techstore.com');
      const producto = await createTestProduct({ tienda_id: 'Lima', es_premium: true });
      
      const res = await request(app)
        .put(`/api/products/${producto.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ precio: 1500 });
      
      expect(res.status).toBe(200);
      expect(res.body.precio).toBe('1500.00');
    });

    test('Gerente NO puede modificar categoría', async () => {
      const token = await getTokenForUser('gerente_lima@techstore.com');
      const producto = await createTestProduct({ tienda_id: 'Lima' });
      
      const res = await request(app)
        .put(`/api/products/${producto.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ categoria: 'Nueva' });
      
      expect(res.status).toBe(403);
    });
  });

  describe('Escenario 4: ABAC - Empleado intenta eliminar', () => {
    test('Empleado no puede eliminar productos', async () => {
      const token = await getTokenForRole('Empleado');
      const producto = await createTestProduct({ tienda_id: 'Lima' });
      
      const res = await request(app)
        .delete(`/api/products/${producto.id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('denegado');
    });
  });
});
```

**package.json scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Beneficios:**
- ✅ Validación automática de reglas RBAC y ABAC
- ✅ Detección temprana de regresiones
- ✅ Documentación viva del comportamiento esperado
- ✅ Confianza para refactorizar código

**Esfuerzo estimado:** 1-2 semanas

---

## 3. 🎨 Frontend Mejorado

### Descripción
Expandir el frontend actual con gestión completa de roles/usuarios, dashboard administrativo y mejores UX/UI.

### Estado Actual
- Frontend básico funcional (Login, MFA, Productos)
- No hay gestión de usuarios ni roles desde UI
- No hay dashboard o analytics

### Implementación Sugerida

**Nuevas páginas/componentes:**

```
client/src/
  pages/
    ├── Dashboard.jsx        # Panel principal con métricas
    ├── Users.jsx            # CRUD de usuarios
    ├── Roles.jsx            # CRUD de roles
    ├── AuditLogs.jsx        # Visualización de auditoría
    ├── Profile.jsx          # Perfil de usuario + MFA setup
    └── Reports.jsx          # Reportes por tienda/categoría
  components/
    ├── Layout.jsx           # Layout con sidebar/navbar
    ├── Sidebar.jsx          # Navegación lateral
    ├── ProtectedRoute.jsx   # HOC para rutas protegidas
    ├── RoleGuard.jsx        # Mostrar/ocultar por rol
    └── DataTable.jsx        # Tabla reutilizable
```

**Dashboard.jsx - Ejemplo:**
```jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard({ token, user, roles }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    premiumProducts: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    const [products, users] = await Promise.all([
      axios.get('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
      roles.includes('Admin') ? 
        axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } }) : 
        null
    ]);

    setStats({
      totalProducts: products.data.length,
      lowStock: products.data.filter(p => p.stock < 10).length,
      premiumProducts: products.data.filter(p => p.es_premium).length,
      totalUsers: users?.data.length || 0
    });
  }

  return (
    <div className="dashboard">
      <h1>Dashboard - {user.nombre_completo}</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Productos</h3>
          <p className="stat-number">{stats.totalProducts}</p>
        </div>
        <div className="stat-card alert">
          <h3>Stock Bajo</h3>
          <p className="stat-number">{stats.lowStock}</p>
        </div>
        <div className="stat-card">
          <h3>Productos Premium</h3>
          <p className="stat-number">{stats.premiumProducts}</p>
        </div>
        {roles.includes('Admin') && (
          <div className="stat-card">
            <h3>Total Usuarios</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Mejoras UX/UI:**
- 🎨 Librería de componentes (Material-UI, Ant Design o Chakra UI)
- 📱 Diseño responsive móvil
- 🌙 Modo oscuro
- 📊 Gráficos con Chart.js o Recharts
- 🔍 Búsqueda y filtros avanzados
- 📄 Paginación en tablas
- ⚡ Loading states y feedback visual
- 🚨 Toasts/notificaciones

**Beneficios:**
- ✅ Experiencia de usuario profesional
- ✅ Gestión completa sin necesidad de APIs externas
- ✅ Visualización de métricas de negocio
- ✅ Reducción de errores operativos

**Esfuerzo estimado:** 2-3 semanas

---

## 4. 🗄️ Base de Datos - PostgreSQL/MySQL

### Descripción
Migrar de SQLite a PostgreSQL o MySQL para entorno de producción con mejor rendimiento, concurrencia y características enterprise.

### Estado Actual
- SQLite funcional para desarrollo
- No optimizado para múltiples conexiones concurrentes
- Sin soporte para transacciones complejas a escala

### Implementación Sugerida

**Opción A: PostgreSQL**

**Dependencias:**
```bash
npm install pg pg-hstore
```

**config.js:**
```javascript
module.exports = {
  // ... resto de config
  sequelize: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'techstore',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  }
};
```

**Docker Compose para desarrollo:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: techstore
      POSTGRES_USER: techstore_user
      POSTGRES_PASSWORD: techstore_pass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: .
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_NAME: techstore
      DB_USER: techstore_user
      DB_PASSWORD: techstore_pass
    ports:
      - "4000:4000"

volumes:
  pgdata:
```

**Migraciones:**
```javascript
// migrations/001-initial-schema.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('usuarios', { /* ... */ });
    await queryInterface.createTable('roles', { /* ... */ });
    await queryInterface.createTable('usuario_roles', { /* ... */ });
    await queryInterface.createTable('productos', { /* ... */ });
    await queryInterface.createTable('audit_logs', { /* ... */ });
    
    // Índices para optimización
    await queryInterface.addIndex('usuarios', ['email']);
    await queryInterface.addIndex('productos', ['tienda_id']);
    await queryInterface.addIndex('productos', ['es_premium']);
    await queryInterface.addIndex('usuario_roles', ['usuario_id', 'rol_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('usuario_roles');
    await queryInterface.dropTable('productos');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('usuarios');
  }
};
```

**Opción B: MySQL**

```javascript
// Similar, cambiar dialect a 'mysql' y usar mysql2 como dependencia
npm install mysql2
```

**Mejoras adicionales:**
- 🔄 Implementar migraciones con Sequelize CLI
- 📦 Backups automatizados
- 🔍 Índices optimizados para consultas frecuentes
- 📊 Views materializadas para reportes
- 🔐 Cifrado de columnas sensibles

**Beneficios:**
- ✅ Mejor rendimiento en producción
- ✅ Soporte para múltiples conexiones concurrentes
- ✅ Características enterprise (replicación, clustering)
- ✅ Mejor integridad referencial
- ✅ Herramientas de administración robustas

**Esfuerzo estimado:** 1 semana

---

## 5. 📚 Documentación API - Swagger/OpenAPI

### Descripción
Agregar documentación interactiva de la API usando Swagger/OpenAPI para facilitar el desarrollo frontend y la integración.

### Estado Actual
- API funcional sin documentación formal
- Endpoints documentados solo en README
- Sin sandbox para pruebas

### Implementación Sugerida

**Dependencias:**
```bash
npm install swagger-ui-express swagger-jsdoc
```

**swagger.js:**
```javascript
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TechStore API',
      version: '1.0.0',
      description: 'API para Sistema de Gestión de Inventario con RBAC y ABAC',
      contact: {
        name: 'TechStore Dev Team'
      }
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Development' },
      { url: 'https://api.techstore.com', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            nombre_completo: { type: 'string' },
            tienda_id: { type: 'string' },
            mfa_enabled: { type: 'boolean' },
            activo: { type: 'boolean' },
            fecha_creacion: { type: 'string', format: 'date-time' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            descripcion: { type: 'string' },
            precio: { type: 'number', format: 'decimal' },
            stock: { type: 'integer' },
            categoria: { type: 'string' },
            tienda_id: { type: 'string' },
            es_premium: { type: 'boolean' }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string', enum: ['Admin', 'Gerente', 'Empleado', 'Auditor'] },
            descripcion: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsDoc(options);

module.exports = { swaggerUi, specs };
```

**server.js:**
```javascript
const { swaggerUi, specs } = require('./swagger');

// Después de las rutas
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

**Ejemplo de documentación en routes/auth.js:**
```javascript
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nombre_completo
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Debe contener mayúscula, número y carácter especial
 *               nombre_completo:
 *                 type: string
 *               tienda_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *       400:
 *         description: Datos inválidos o contraseña no cumple política
 *       409:
 *         description: Email ya registrado
 */
router.post('/register', auth.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token completo
 *                 - type: object
 *                   properties:
 *                     mfa_required:
 *                       type: boolean
 *                       example: true
 *                     token:
 *                       type: string
 *                       description: JWT temporal para MFA
 *       401:
 *         description: Credenciales inválidas
 *       423:
 *         description: Cuenta bloqueada temporalmente
 */
router.post('/login', auth.login);
```

**Documentar políticas ABAC:**
```javascript
/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar producto
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoria:
 *                 type: string
 *                 description: Solo Admin puede modificar
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       403:
 *         description: >
 *           Acceso denegado por políticas ABAC:
 *           - Empleado solo puede actualizar 'stock'
 *           - Gerente no puede modificar 'categoria'
 *           - Solo productos de su tienda
 */
router.put('/:id', auth, permit('update'), ctrl.updateProduct);
```

**Acceso a documentación:**
```
http://localhost:4000/api-docs
```

**Beneficios:**
- ✅ Documentación siempre actualizada
- ✅ Sandbox interactivo para probar endpoints
- ✅ Generación automática de clientes API
- ✅ Onboarding más rápido para nuevos developers
- ✅ Estándar de industria (OpenAPI 3.0)

**Esfuerzo estimado:** 1 semana

---

## 📊 Priorización Recomendada

### Alto Impacto / Bajo Esfuerzo
1. **Contador de intentos MFA** - 2-3 horas
2. **Documentación API** - 1 semana

### Alto Impacto / Medio Esfuerzo
3. **Tests automatizados** - 1-2 semanas
4. **Base de datos PostgreSQL** - 1 semana

### Medio Impacto / Alto Esfuerzo
5. **Frontend mejorado** - 2-3 semanas

---

## 🎯 Roadmap Sugerido

### Sprint 1 (1 semana)
- ✅ Contador de intentos MFA
- ✅ Documentación Swagger básica

### Sprint 2 (2 semanas)
- ✅ Tests de escenarios principales
- ✅ Migración a PostgreSQL

### Sprint 3-4 (3 semanas)
- ✅ Suite completa de tests
- ✅ Frontend: Dashboard y gestión de usuarios

### Sprint 5 (1 semana)
- ✅ Frontend: Gestión de roles y auditoría
- ✅ Refinamiento y bug fixes

---

## 📝 Notas Finales

- Todas las mejoras son **opcionales** y no afectan el cumplimiento actual del 100%
- El proyecto está **listo para evaluación** en su estado actual
- Estas mejoras preparan el sistema para un entorno de **producción real**
- Se recomienda implementarlas en el orden sugerido para maximizar el ROI

**Fecha de última actualización:** 6 de mayo de 2026
