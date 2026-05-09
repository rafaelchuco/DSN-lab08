import React, { useState } from 'react'
import Login from './pages/Login'
import MFA from './pages/MFA'
import Products from './pages/Products'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Roles from './pages/Roles'
import AuditLogs from './pages/AuditLogs'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [mfaTempToken, setMfaTempToken] = useState(null)
  const [roles, setRoles] = useState([])
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('dashboard')

  async function fetchMe() {
    if (!token) {
      setRoles([])
      setUser(null)
      return
    }
    try {
      const res = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setRoles(data.roles || [])
      if (res.ok) setUser(data.user || null)
    } catch (err) {
      setRoles([])
      setUser(null)
    }
  }

  // fetch user info when token changes
  React.useEffect(() => {
    fetchMe()
  }, [token])

  // Handle hash navigation
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard'
      setCurrentPage(hash)
    }
    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function handleLoginSuccess(tkn) {
    if (tkn.mfa_required) {
      setMfaTempToken(tkn.token)
      return
    }
    if (tkn.mfa_setup_required) {
      localStorage.setItem('token', tkn.token)
      setToken(tkn.token)
      return
    }
    localStorage.setItem('token', tkn.token)
    setToken(tkn.token)
  }

  function handleMfaSuccess(fullToken) {
    localStorage.setItem('token', fullToken)
    setToken(fullToken)
    setMfaTempToken(null)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
    setRoles([])
    setUser(null)
    setCurrentPage('dashboard')
  }

  if (!token && mfaTempToken) {
    return <MFA tempToken={mfaTempToken} onSuccess={handleMfaSuccess} />
  }

  if (!token) return <Login onLogin={handleLoginSuccess} />

  return (
    <Layout user={user} roles={roles} onLogout={handleLogout}>
      {currentPage === 'dashboard' && (
        <Dashboard token={token} user={user} roles={roles} onUserRefresh={fetchMe} />
      )}
      {currentPage === 'products' && (
        <ProtectedRoute roles={roles} requiredRoles={['Admin', 'Gerente', 'Empleado']}>
          <Products token={token} roles={roles} user={user} onLogout={handleLogout} />
        </ProtectedRoute>
      )}
      {currentPage === 'users' && (
        <ProtectedRoute roles={roles} requiredRoles={['Admin']}>
          <Users token={token} roles={roles} />
        </ProtectedRoute>
      )}
      {currentPage === 'roles' && (
        <ProtectedRoute roles={roles} requiredRoles={['Admin']}>
          <Roles token={token} roles={roles} />
        </ProtectedRoute>
      )}
      {currentPage === 'audit' && (
        <ProtectedRoute roles={roles} requiredRoles={['Auditor', 'Admin']}>
          <AuditLogs token={token} roles={roles} />
        </ProtectedRoute>
      )}
    </Layout>
  )
}
