const db = require('../models');
const policy = require('../utils/policy-engine');

function permit(action) {
  return async function (req, res, next) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    const user = await db.User.findByPk(userId);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const userRolesRows = await db.UserRole.findAll({ where: { usuario_id: userId } });
    const roleIds = userRolesRows.map(r => r.rol_id);
    const roles = await db.Role.findAll({ where: { id: roleIds } });
    const roleNames = roles.map(r => r.nombre);

    let resource = null;
    if (req.params.id) {
      resource = await db.Product.findByPk(req.params.id);
      if (!resource && (action !== 'insert' && action !== 'select')) return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    const payload = Object.assign({}, req.body);

    const allowed = policy.isAllowed({ roles: roleNames, user, action, resource, payload });
    if (!allowed) return res.status(403).json({ error: 'Acceso denegado por políticas' });
    // attach context for controller
    req._abac = { roles: roleNames, user, resource };
    return next();
  };
}

module.exports = { permit };
