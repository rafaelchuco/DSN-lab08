const db = require('../models');
const { logAction } = require('../utils/logger');

async function listRoles(req, res) {
  const roles = await db.Role.findAll();
  return res.json(roles);
}

async function getRole(req, res) {
  const id = req.params.id;
  const role = await db.Role.findByPk(id);
  if (!role) return res.status(404).json({ error: 'Rol no encontrado' });
  return res.json(role);
}

async function createRole(req, res) {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'nombre requerido' });
  const role = await db.Role.create({ nombre, descripcion });
  await logAction({ usuario_id: req.userId, action: 'role_create', resource_type: 'Role', resource_id: role.id, details: { nombre }, ip: req.ip });
  return res.status(201).json(role);
}

async function updateRole(req, res) {
  const id = req.params.id;
  const role = await db.Role.findByPk(id);
  if (!role) return res.status(404).json({ error: 'Rol no encontrado' });
  const { nombre, descripcion } = req.body;
  role.nombre = nombre || role.nombre;
  role.descripcion = descripcion || role.descripcion;
  await role.save();
  await logAction({ usuario_id: req.userId, action: 'role_update', resource_type: 'Role', resource_id: role.id, details: { nombre: role.nombre }, ip: req.ip });
  return res.json(role);
}

async function deleteRole(req, res) {
  const id = req.params.id;
  const role = await db.Role.findByPk(id);
  if (!role) return res.status(404).json({ error: 'Rol no encontrado' });
  const count = await db.UserRole.count({ where: { rol_id: id } });
  if (count > 0) return res.status(400).json({ error: 'No se puede eliminar rol con usuarios asignados' });
  await role.destroy();
  await logAction({ usuario_id: req.userId, action: 'role_delete', resource_type: 'Role', resource_id: role.id, ip: req.ip });
  return res.json({ ok: true });
}

module.exports = { listRoles, getRole, createRole, updateRole, deleteRole };
