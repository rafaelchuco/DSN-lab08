// Simple ABAC policy engine for TechStore
// Exports isAllowed({ roles, user, action, resource, payload }) -> boolean

function hasRole(roles, name) {
  return roles.includes(name);
}

function isAllowed({ roles, user, action, resource, payload }) {
  // roles: array of role names
  // user: user instance (has tienda_id)
  // resource: product instance (may be null for create)
  // payload: incoming data for create/update

  // Admin: full access
  if (hasRole(roles, 'Admin')) return true;

  // Auditor: read-only all
  if (hasRole(roles, 'Auditor')) {
    if (action === 'select') return true;
    return false;
  }

  // Gerente and Empleado: scoped by tienda
  const isGerente = hasRole(roles, 'Gerente');
  const isEmpleado = hasRole(roles, 'Empleado');

  const tiendaUser = user ? user.tienda_id : null;
  const tiendaResource = resource ? resource.tienda_id : (payload ? payload.tienda_id : null);

  if (action === 'select') {
    if (isGerente || isEmpleado) {
      return tiendaResource == null ? true : String(tiendaResource) === String(tiendaUser);
    }
    return false;
  }

  if (action === 'insert') {
    if (isGerente) {
      return String(payload.tienda_id) === String(tiendaUser);
    }
    if (isEmpleado) {
      // Empleado: only non premium in their tienda
      return String(payload.tienda_id) === String(tiendaUser) && !payload.es_premium;
    }
    return false;
  }

  if (action === 'update') {
    if (isGerente) {
      // Gerente: only in their tienda and cannot modify categoria
      if (String(resource.tienda_id) !== String(tiendaUser)) return false;
      if (payload && Object.prototype.hasOwnProperty.call(payload, 'categoria')) return false;
      return true;
    }
    if (isEmpleado) {
      // Empleado: only update stock in their tienda
      if (String(resource.tienda_id) !== String(tiendaUser)) return false;
      // only stock field allowed
      const keys = Object.keys(payload || {});
      return keys.length === 1 && keys[0] === 'stock';
    }
    return false;
  }

  if (action === 'delete') {
    if (isGerente) {
      // only non premium in their tienda
      if (String(resource.tienda_id) !== String(tiendaUser)) return false;
      return !resource.es_premium;
    }
    // Empleado/Auditor cannot delete
    return false;
  }

  return false;
}

module.exports = { isAllowed };
