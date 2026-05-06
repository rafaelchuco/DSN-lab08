const db = require('../models');
const bcrypt = require('bcrypt');
const { logAction } = require('../utils/logger');
const config = require('../config');

const PASSWORD_REGEX = new RegExp(
  `^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{${config.passwordPolicy.minLength},}$`
);

async function getMe(req, res) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'No autorizado' });
  const user = await db.User.findByPk(userId, { attributes: { exclude: ['passwordHash', 'mfa_secret'] } });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const userRoles = await db.UserRole.findAll({ where: { usuario_id: userId } });
  const roleIds = userRoles.map(r => r.rol_id);
  const roles = await db.Role.findAll({ where: { id: roleIds } });
  const roleNames = roles.map(r => r.nombre);
  return res.json({ user, roles: roleNames });
}

async function listUsers(req, res) {
  const users = await db.User.findAll({ attributes: { exclude: ['passwordHash', 'mfa_secret'] } });
  return res.json(users);
}

async function getUser(req, res) {
  const id = req.params.id;
  const user = await db.User.findByPk(id, { attributes: { exclude: ['passwordHash', 'mfa_secret'] } });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  return res.json(user);
}

async function createUser(req, res) {
  const { email, password, nombre_completo, tienda_id } = req.body;
  if (!email || !password || !nombre_completo) return res.status(400).json({ error: 'Faltan campos' });
  if (!PASSWORD_REGEX.test(password)) return res.status(400).json({ error: 'Contraseña no cumple la política' });
  const existing = await db.User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email ya registrado' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.User.create({ email, passwordHash, nombre_completo, tienda_id });
  await logAction({ usuario_id: req.userId || user.id, action: 'user_create', resource_type: 'User', resource_id: user.id, details: { email }, ip: req.ip });
  return res.status(201).json({ id: user.id, email: user.email });
}

async function updateUser(req, res) {
  const id = req.params.id;
  const user = await db.User.findByPk(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { nombre_completo, tienda_id, activo } = req.body;
  user.nombre_completo = nombre_completo || user.nombre_completo;
  user.tienda_id = tienda_id || user.tienda_id;
  if (typeof activo !== 'undefined') user.activo = !!activo;
  await user.save();
  await logAction({ usuario_id: req.userId, action: 'user_update', resource_type: 'User', resource_id: user.id, details: { nombre_completo: user.nombre_completo }, ip: req.ip });
  return res.json({ id: user.id, email: user.email });
}

async function deleteUser(req, res) {
  const id = req.params.id;
  const user = await db.User.findByPk(id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  await user.destroy();
  await logAction({ usuario_id: req.userId, action: 'user_delete', resource_type: 'User', resource_id: user.id, ip: req.ip });
  return res.json({ ok: true });
}

async function assignRole(req, res) {
  const userId = req.params.id;
  const { rol_id, asignado_por } = req.body;
  const user = await db.User.findByPk(userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const role = await db.Role.findByPk(rol_id);
  if (!role) return res.status(404).json({ error: 'Rol no encontrado' });
  const ur = await db.UserRole.create({ usuario_id: userId, rol_id, asignado_por });
  await logAction({ usuario_id: req.userId, action: 'assign_role', resource_type: 'UserRole', resource_id: ur.id, details: { usuario_id: userId, rol_id }, ip: req.ip });
  return res.status(201).json(ur);
}

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser, assignRole, getMe };

