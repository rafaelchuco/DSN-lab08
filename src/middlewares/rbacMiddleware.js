const db = require('../models');

// middleware factory: require one of the roles
function requireRole(roleName) {
  return async function (req, res, next) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const userRoles = await db.UserRole.findAll({ where: { usuario_id: userId } });
    if (!userRoles || userRoles.length === 0) return res.status(403).json({ error: 'Sin roles asignados' });
    const roleIds = userRoles.map(r => r.rol_id);
    const roles = await db.Role.findAll({ where: { id: roleIds } });
    const names = roles.map(r => r.nombre);
    if (names.includes(roleName)) return next();
    return res.status(403).json({ error: `Requiere rol ${roleName}` });
  };
}

module.exports = { requireRole };
