import React from 'react'

export default function Layout({ children, user, roles, onLogout }) {
  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>🏪 TechStore</h1>
        </div>
        <div className="navbar-menu">
          <a href="#dashboard">Dashboard</a>
          {(roles.includes('Admin') || roles.includes('Gerente') || roles.includes('Empleado')) && (
            <a href="#products">Productos</a>
          )}
          {roles.includes('Admin') && (
            <>
              <a href="#users">Usuarios</a>
              <a href="#roles">Roles</a>
            </>
          )}
          {roles.includes('Auditor') && (
            <a href="#audit">Auditoría</a>
          )}
        </div>
        <div className="navbar-user">
          <span className="user-info">
            <strong>{user?.nombre_completo}</strong>
            {user?.tienda_id && <span className="badge">{user.tienda_id}</span>}
            {roles.map(r => <span key={r} className="badge role-badge">{r}</span>)}
          </span>
          <button onClick={onLogout} className="btn-logout">Cerrar sesión</button>
        </div>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
