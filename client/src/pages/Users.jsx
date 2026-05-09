import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Users({ token, roles }) {
  const [users, setUsers] = useState([])
  const [allRoles, setAllRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre_completo: '',
    tienda_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [usersRes, rolesRes] = await Promise.all([
        axios.get('/api/users', { headers }),
        axios.get('/api/roles', { headers })
      ])
      setUsers(usersRes.data)
      setAllRoles(rolesRes.data)
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
      setLoading(false)
    }
  }

  async function createUser(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await axios.post('/api/users', form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(prev => [...prev, res.data])
      setForm({ email: '', password: '', nombre_completo: '', tienda_id: '' })
      setShowForm(false)
      alert('Usuario creado exitosamente')
      fetchData() // Refrescar lista
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  async function assignRole(userId, rolId) {
    try {
      await axios.post(`/api/users/${userId}/roles`, 
        { rol_id: rolId, asignado_por: null },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Rol asignado exitosamente')
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    }
  }

  async function toggleActive(userId, currentActive) {
    try {
      await axios.put(`/api/users/${userId}`,
        { activo: !currentActive },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    }
  }

  async function toggleMfaRequired(userId, currentRequired) {
    try {
      await axios.put(`/api/users/${userId}/mfa-required`,
        { required: !currentRequired },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    }
  }

  async function unlockMfa(userId) {
    try {
      await axios.post(`/api/users/${userId}/mfa-unlock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('MFA desbloqueado exitosamente')
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    }
  }

  if (!roles.includes('Admin')) {
    return <div className="access-denied">Solo Admin puede gestionar usuarios</div>
  }

  if (loading) return <div className="loading">Cargando usuarios...</div>

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>👥 Gestión de Usuarios</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Crear Usuario'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <form onSubmit={createUser} className="form-card">
          <h3>Nuevo Usuario</h3>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Contraseña *</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              minLength="8"
              required
            />
            <small>Mínimo 8 caracteres, mayúscula, número y carácter especial</small>
          </div>
          <div className="form-group">
            <label>Nombre Completo *</label>
            <input
              value={form.nombre_completo}
              onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Tienda</label>
            <input
              value={form.tienda_id}
              onChange={e => setForm({ ...form, tienda_id: e.target.value })}
              placeholder="Lima, Arequipa, Cusco, etc."
            />
          </div>
          <button type="submit" className="btn-primary">Crear Usuario</button>
        </form>
      )}

      <div className="users-list">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Tienda</th>
              <th>MFA</th>
              <th>Req. MFA</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={!user.activo ? 'inactive' : ''}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.nombre_completo}</td>
                <td>{user.roles && user.roles.length ? user.roles.join(', ') : '-'}</td>
                <td>{user.tienda_id || '-'}</td>
                <td>
                  {user.mfa_lock_until && new Date(user.mfa_lock_until) > new Date() ? (
                    <span title="Bloqueado por intentos fallidos">🔒 Bloqueado</span>
                  ) : (
                    user.mfa_enabled ? '✅' : '❌'
                  )}
                </td>
                <td>{user.mfa_required ? '✅' : '❌'}</td>
                <td>
                  <span className={`badge ${user.activo ? 'active' : 'inactive'}`}>
                    {user.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="actions">
                  {user.mfa_lock_until && new Date(user.mfa_lock_until) > new Date() && (
                    <button
                      onClick={() => unlockMfa(user.id)}
                      className="btn-unlock-mfa"
                      title="Desbloquear MFA"
                    >
                      🔓 Desbloquear MFA
                    </button>
                  )}
                  <select
                    onChange={(e) => e.target.value && assignRole(user.id, parseInt(e.target.value))}
                    defaultValue=""
                  >
                    <option value="">Asignar rol...</option>
                    {allRoles.map(role => (
                      <option key={role.id} value={role.id}>{role.nombre}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => toggleActive(user.id, user.activo)}
                    className="btn-small"
                  >
                    {user.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => toggleMfaRequired(user.id, !!user.mfa_required)}
                    className={`btn-mfa ${user.mfa_required ? 'active' : ''}`}
                    title={user.mfa_required ? 'Quitar requisito MFA' : 'Exigir MFA para este usuario'}
                  >
                    {user.mfa_required ? 'Quitar Req. MFA' : 'Exigir MFA'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
