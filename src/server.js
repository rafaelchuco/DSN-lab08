const express = require('express');
const bodyParser = require('express').json;
const db = require('./models');
const authRoutes = require('./routes/auth');
const rolesRoutes = require('./routes/roles');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const config = require('./config');
const { swaggerUi, specs } = require('./swagger');

const app = express();
app.use(bodyParser());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

async function start() {
  await db.sequelize.sync({ alter: true });

  // Seed default roles
  const defaultRoles = ['Admin', 'Gerente', 'Empleado', 'Auditor'];
  for (const nombre of defaultRoles) {
    const [r] = await db.Role.findOrCreate({ where: { nombre }, defaults: { descripcion: `${nombre} role` } });
  }

  // Create initial admin user if none
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@techstore.com';
  const admin = await db.User.findOne({ where: { email: adminEmail } });
  if (!admin) {
    const bcrypt = require('bcrypt');
    const pw = process.env.ADMIN_PASSWORD || 'Admin123!';
    const passwordHash = await bcrypt.hash(pw, 10);
    const u = await db.User.create({ email: adminEmail, passwordHash, nombre_completo: 'Administrator' });
    const adminRole = await db.Role.findOne({ where: { nombre: 'Admin' } });
    if (adminRole) await db.UserRole.create({ usuario_id: u.id, rol_id: adminRole.id, asignado_por: u.id });
    console.log('Admin user created:', adminEmail);
  }
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server listening on ${port}`);
    console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
  });
}

start().catch(err => {
  console.error('Failed to start', err);
  process.exit(1);
});
