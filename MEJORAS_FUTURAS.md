# TechStore — Roadmap y Mejoras Pendientes

![Estado](https://img.shields.io/badge/Proyecto-En_Producción-blue?style=flat)

> Este documento lista las mejoras **pendientes de implementar**. Las mejoras ya completadas están documentadas en [GUIA_MEJORAS.md](./GUIA_MEJORAS.md).

---

## Estado Actual del Proyecto

### Ya Implementado ✅

| Mejora | Descripción |
|--------|-------------|
| ✅ Contador de intentos MFA | Bloqueo de 15 min tras 3 intentos fallidos |
| ✅ Soporte PostgreSQL | Multi-dialecto SQLite/PostgreSQL |
| ✅ Documentación Swagger | API interactiva en `/api-docs` |
| ✅ Frontend completo | 7 páginas con navegación por rol |
| ✅ Docker Compose | 3 servicios orquestados |
| ✅ Auditoría de acciones | Tabla `audit_logs` con todos los eventos |

### Pendiente de Implementar 🔲

| # | Mejora | Prioridad | Esfuerzo estimado |
|---|--------|:---------:|:-----------------:|
| 1 | Tests automatizados | Alta | 1-2 semanas |
| 2 | Rate limiting global | Alta | 2-4 horas |
| 3 | Refresh tokens / sesiones largas | Media | 1 semana |
| 4 | Notificaciones por email (login sospechoso) | Media | 3-5 días |
| 5 | Paginación en tablas del frontend | Media | 1-2 días |
| 6 | Modo oscuro en el frontend | Baja | 1-2 días |
| 7 | Exportación de reportes (PDF/Excel) | Baja | 1 semana |
| 8 | Migraciones Sequelize CLI | Baja | 2-3 días |

---

## Detalle de Mejoras Pendientes

---

### 1. Tests Automatizados (Prioridad Alta)

**Descripción:** Implementar una suite de tests automatizados que valide los 4 escenarios del caso de estudio y sirva como red de seguridad ante futuros cambios.

**Por qué es prioritario:** Actualmente las políticas RBAC y ABAC solo se prueban manualmente. Un bug en el motor de políticas podría pasar desapercibido.

**Stack sugerido:**

```bash
npm install --save-dev jest supertest
```

**Estructura propuesta:**

```
tests/
├── unit/
│   ├── policy-engine.test.js    # Tests del motor ABAC
│   ├── mfa.utils.test.js        # Tests de generación/verificación TOTP
│   └── auth.validation.test.js  # Tests de validación de contraseña
└── integration/
    ├── auth.test.js             # Login, registro, MFA, bloqueos
    ├── rbac.test.js             # Permisos por rol en cada endpoint
    ├── abac.test.js             # Políticas de productos por tienda/premium
    └── audit.test.js            # Verificar que las acciones se registran
```

**Ejemplo de test ABAC:**

```javascript
describe('ABAC — Políticas de Productos', () => {
  test('Empleado solo puede actualizar stock', async () => {
    const token = await loginAs('empleado@techstore.com', 'Empleado123!');
    const producto = await crearProductoDeTest({ tienda_id: 'Lima' });

    // Actualizar stock → debe funcionar
    const resStock = await request(app)
      .put(`/api/products/${producto.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ stock: 99 });
    expect(resStock.status).toBe(200);

    // Actualizar precio → debe fallar
    const resPrecio = await request(app)
      .put(`/api/products/${producto.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ precio: 999 });
    expect(resPrecio.status).toBe(403);
  });

  test('Gerente no puede eliminar productos premium', async () => {
    const token = await loginAs('gerente@techstore.com', 'Gerente123!');
    const premium = await crearProductoDeTest({ tienda_id: 'Lima', es_premium: true });

    const res = await request(app)
      .delete(`/api/products/${premium.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('Gerente no puede ver productos de otra tienda', async () => {
    const token = await loginAs('gerente@techstore.com', 'Gerente123!');
    // gerente es de Lima, producto es de Arequipa
    const productoBajada = await crearProductoDeTest({ tienda_id: 'Arequipa' });

    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);
    
    const ids = res.body.map(p => p.id);
    expect(ids).not.toContain(productoBajada.id);
  });
});
```

**Scripts a agregar en `package.json`:**

```json
{
  "scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "setupFilesAfterFramework": ["./tests/setup.js"]
  }
}
```

**Beneficios:**
- Detección automática de regresiones en RBAC/ABAC
- Documentación viva del comportamiento esperado
- Confianza para refactorizar el motor de políticas
- Base para CI/CD pipeline

---

### 2. Rate Limiting Global (Prioridad Alta)

**Descripción:** Agregar límite de peticiones por IP para proteger los endpoints públicos de ataques de fuerza bruta y abuso de la API.

**Por qué es prioritario:** Actualmente cualquier IP puede hacer miles de peticiones por segundo a `/api/auth/login` o `/api/auth/register`.

**Implementación:**

```bash
npm install express-rate-limit
```

```javascript
// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Límite general para toda la API
exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,                  // 100 peticiones por IP
  message: { error: 'Demasiadas peticiones. Intenta en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Límite más estricto para autenticación
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                   // 10 intentos de login por IP
  message: { error: 'Demasiados intentos de autenticación.' }
});
```

```javascript
// En server.js
const { apiLimiter, authLimiter } = require('./middlewares/rateLimiter');

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

**Esfuerzo estimado:** 2-4 horas

---

### 3. Refresh Tokens / Sesiones Largas (Prioridad Media)

**Descripción:** Implementar un sistema de refresh tokens para que los usuarios puedan mantener sesiones largas sin necesidad de volver a autenticarse con MFA.

**Flujo propuesto:**

```
Login exitoso
  └─ Emite: access_token (vigencia corta: 15 min)
             refresh_token (vigencia larga: 7 días, almacenado en DB)

Access token expirado
  └─ Cliente envía refresh_token
       └─ Backend emite nuevo access_token (sin pedir MFA de nuevo)

Logout
  └─ Invalida el refresh_token en DB
```

**Cambios requeridos:**
- Nueva tabla `refresh_tokens` (token, usuario_id, expires_at, revoked)
- Endpoint `POST /api/auth/refresh`
- Endpoint `POST /api/auth/logout` (revoca el refresh token)
- Configurar `access_token` con expiración corta (15min)

**Esfuerzo estimado:** 1 semana

---

### 4. Notificaciones por Email (Prioridad Media)

**Descripción:** Enviar alertas por email cuando ocurren eventos de seguridad: cuenta bloqueada, nuevo dispositivo, código MFA por email como alternativa a TOTP.

**Eventos a notificar:**

| Evento | Destinatario | Contenido |
|--------|-------------|-----------|
| Cuenta bloqueada (5 intentos) | Usuario | "Tu cuenta fue bloqueada. Si no fuiste tú, contáctanos." |
| MFA bloqueado | Usuario | "3 intentos fallidos de MFA detectados." |
| Login desde IP nueva | Usuario | "Nuevo acceso desde 192.168.x.x" |
| Usuario creado | Admin | "Nuevo usuario registrado: email" |

**Implementación sugerida:**

```bash
npm install nodemailer
```

```javascript
// src/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendSecurityAlert = async ({ to, subject, message }) => {
  await transporter.sendMail({
    from: '"TechStore Security" <security@techstore.com>',
    to,
    subject,
    html: `<p>${message}</p>`
  });
};
```

**Variables de entorno a agregar:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@techstore.com
SMTP_PASS=app_password
```

**Esfuerzo estimado:** 3-5 días

---

### 5. Paginación en Tablas del Frontend (Prioridad Media)

**Descripción:** Las tablas de Productos, Usuarios y Audit Logs actualmente cargan todos los registros. Con muchos datos esto es lento y consume memoria innecesariamente.

**Cambios en el backend:**

```javascript
// GET /api/products?page=1&limit=20
router.get('/', auth, abac('select'), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const { count, rows } = await Product.findAndCountAll({
    where: /* filtros ABAC */,
    limit,
    offset,
    order: [['fecha_creacion', 'DESC']]
  });

  res.json({
    data: rows,
    pagination: {
      total: count,
      page,
      pages: Math.ceil(count / limit),
      limit
    }
  });
});
```

**Cambios en el frontend:**

Agregar controles de paginación en las tablas:
```
[← Anterior]  Página 2 de 15  [Siguiente →]
```

**Esfuerzo estimado:** 1-2 días

---

### 6. Modo Oscuro en el Frontend (Prioridad Baja)

**Descripción:** Agregar soporte para modo oscuro usando variables CSS con preferencia del sistema (`prefers-color-scheme`).

**Implementación:**

```css
/* styles.css */
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a2e;
  --surface: #f5f5f5;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1a1a2e;
    --text-primary: #e0e0e0;
    --surface: #16213e;
  }
}
```

**Toggle manual:** Agregar botón en el Layout para cambiar entre modo claro y oscuro, guardando la preferencia en `localStorage`.

**Esfuerzo estimado:** 1-2 días

---

### 7. Exportación de Reportes PDF/Excel (Prioridad Baja)

**Descripción:** Permitir a Admin y Auditor exportar los datos de productos, usuarios y audit logs en formato PDF o Excel.

**Implementación sugerida:**

```bash
npm install exceljs pdfkit
```

```javascript
// GET /api/products/export?format=xlsx
router.get('/export', auth, rbac(['Admin', 'Auditor']), async (req, res) => {
  const products = await Product.findAll();
  const format = req.query.format || 'xlsx';

  if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Productos');
    sheet.columns = [
      { header: 'Nombre', key: 'nombre' },
      { header: 'Precio', key: 'precio' },
      { header: 'Stock', key: 'stock' },
      { header: 'Tienda', key: 'tienda_id' }
    ];
    products.forEach(p => sheet.addRow(p.toJSON()));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
  }
});
```

**Esfuerzo estimado:** 1 semana

---

### 8. Migraciones con Sequelize CLI (Prioridad Baja)

**Descripción:** Reemplazar `sequelize.sync({ alter: true })` por migraciones versionadas usando Sequelize CLI, lo cual es más seguro en producción.

**Por qué es importante para producción:** `alter: true` puede causar pérdida de datos en producción al modificar columnas existentes. Las migraciones son deterministas y reversibles.

**Implementación:**

```bash
npm install --save-dev sequelize-cli
npx sequelize-cli init

# Crear primera migración
npx sequelize-cli migration:generate --name create-initial-schema

# Ejecutar migraciones pendientes
npx sequelize-cli db:migrate

# Revertir última migración
npx sequelize-cli db:migrate:undo
```

**Esfuerzo estimado:** 2-3 días

---

## Criterios de Priorización

```
Alta    → Impacta seguridad o es requisito para producción real
Media   → Mejora la experiencia o reduce deuda técnica
Baja    → Nice to have, no bloquea ningún flujo crítico
```

---

## Referencias

| Documento | Descripción |
|----------|-------------|
| [GUIA_MEJORAS.md](./GUIA_MEJORAS.md) | Mejoras ya implementadas |
| [README.md](./README.md) | Documentación principal |
| [USUARIOS_PRUEBA.md](./USUARIOS_PRUEBA.md) | Escenarios de prueba |
