const db = require('../models');
const { logAction } = require('../utils/logger');

async function listProducts(req, res) {
  // If Admin or Auditor, return all; otherwise scope to user's tienda
  const abac = req._abac || {};
  const roles = abac.roles || [];
  const user = abac.user;

  const isAdmin = roles.includes('Admin');
  const isAuditor = roles.includes('Auditor');

  let where = {};
  if (!isAdmin && !isAuditor) {
    where.tienda_id = user.tienda_id;
  }

  const products = await db.Product.findAll({ where });
  return res.json(products);
}

async function getProduct(req, res) {
  const id = req.params.id;
  const p = await db.Product.findByPk(id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  // ABAC middleware already validated access
  return res.json(p);
}

async function createProduct(req, res) {
  const { nombre, descripcion, precio, stock, categoria, tienda_id, es_premium } = req.body;
  if (!nombre || typeof tienda_id === 'undefined') return res.status(400).json({ error: 'Faltan campos' });
  if (Number(precio) < 0) return res.status(400).json({ error: 'Precio inválido' });
  if (!Number.isInteger(Number(stock)) || Number(stock) < 0) return res.status(400).json({ error: 'Stock inválido' });

  // double-check ABAC context
  const abac = req._abac || {};
  const roles = abac.roles || [];
  // Empleado cannot create premium
  if (roles.includes('Empleado') && es_premium) return res.status(403).json({ error: 'Empleados no pueden crear productos premium' });
  // Gerente/Empleado must create in their tienda (middleware also checks)
  if ((roles.includes('Gerente') || roles.includes('Empleado')) && String(abac.user?.tienda_id) !== String(tienda_id)) {
    return res.status(403).json({ error: 'Solo puedes crear productos en tu tienda' });
  }

  const p = await db.Product.create({ nombre, descripcion, precio, stock, categoria, tienda_id, es_premium, creado_por: req.userId });
  await logAction({ usuario_id: req.userId, action: 'product_create', resource_type: 'Product', resource_id: p.id, details: { nombre, tienda_id }, ip: req.ip });
  return res.status(201).json(p);
}

async function updateProduct(req, res) {
  const id = req.params.id;
  const p = await db.Product.findByPk(id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  const allowedFields = ['nombre','descripcion','precio','stock','categoria','es_premium'];

  const abac = req._abac || {};
  const roles = abac.roles || [];

  // Enforce role-specific allowed fields
  if (roles.includes('Empleado') && !roles.includes('Admin') && !roles.includes('Gerente')) {
    // Empleado can only update stock
    const keys = Object.keys(req.body);
    if (!(keys.length === 1 && keys[0] === 'stock')) return res.status(403).json({ error: 'Empleados solo pueden actualizar stock' });
  }

  if (roles.includes('Gerente') && !roles.includes('Admin')) {
    // Gerente cannot change categoria
    if (Object.prototype.hasOwnProperty.call(req.body, 'categoria')) return res.status(403).json({ error: 'Gerentes no pueden cambiar categoria' });
  }

  for (const key of Object.keys(req.body)) {
    if (allowedFields.includes(key)) p[key] = req.body[key];
  }
  p.fecha_actualizacion = new Date();
  await p.save();
  await logAction({ usuario_id: req.userId, action: 'product_update', resource_type: 'Product', resource_id: p.id, details: req.body, ip: req.ip });
  return res.json(p);
}

async function deleteProduct(req, res) {
  const id = req.params.id;
  const p = await db.Product.findByPk(id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  await p.destroy();
  await logAction({ usuario_id: req.userId, action: 'product_delete', resource_type: 'Product', resource_id: p.id, ip: req.ip });
  return res.json({ ok: true });
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
