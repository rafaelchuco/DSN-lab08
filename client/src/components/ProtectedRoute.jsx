import React from 'react'

export default function ProtectedRoute({ children, roles, requiredRoles }) {
  const hasAccess = requiredRoles ? requiredRoles.some(r => roles.includes(r)) : true
  
  if (!hasAccess) {
    return (
      <div className="access-denied">
        <h2>⛔ Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta sección.</p>
        <p>Roles requeridos: {requiredRoles.join(', ')}</p>
      </div>
    )
  }
  
  return children
}
