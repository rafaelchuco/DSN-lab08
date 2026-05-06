const db = require('../models');

async function logAction({ usuario_id = null, action, resource_type = null, resource_id = null, details = null, ip = null }) {
  try {
    await db.AuditLog.create({ usuario_id, action, resource_type, resource_id: resource_id ? String(resource_id) : null, details, ip });
  } catch (err) {
    console.error('Failed to write audit log', err);
  }
}

module.exports = { logAction };
