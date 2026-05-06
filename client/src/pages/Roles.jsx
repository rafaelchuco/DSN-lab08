import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Roles({ token, roles }) {
  const [rolesList, setRolesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })

  useEffect(() => {
    fetchRoles()
  }, [])

  async function fetchRoles() {
    try {
      const res = await axios.get('/api/roles', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRolesList(res.data)
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
      setLoading(false)
    }
  }

  async function createRole(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await axios.post('/api/roles', form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRolesList(prev => [...prev, res.data])
      setForm({ nombre: '', descripcion: '' })
      setShowForm(false)
      alert('Rol creado exitosamente')
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  async function updateRole(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await axios.put(`/api/roles/${editingId}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRolesList(prev => prev.map(r => r.id === res.data.id ? res.data : r))
      setForm({ nombre: '', descripcion: '' })
      setEditingId(null)
      alert('Rol actualizado exitosamente')
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  async function deleteRole(id) {
    if (!confirm('¿Eliminar este rol? No se puede eliminar si tiene usuarios asignados.')) return
    try {
      await axios.delete(`/api/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRolesList(prev => prev.filter(r => r.id !== id))
      alert('Rol eliminado exitosamente')
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    }
  }

  function startEdit(role) {
    setEditingId(role.id)
    setForm({ nombre: role.nombre, descripcion: role.descripcion || '' })
    setShowForm(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ nombre: '', descripcion: '' })
  }

  if (!roles.includes('Admin')) {
    return <div className="access-denied">Solo Admin puede gestionar roles</div>
  }

  if (loading) return <div className="loading">Cargando roles...</div>

  return (
    <div className="roles-page">
      <div className="page-header">
        <h1>🎭 Gestión de Roles</h1>
        <button onClick={() => {
          setShowForm(!showForm)
          setEditingId(null)
          setForm({ nombre: '', descripcion: '' })
        }} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Crear Rol'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <form onSubmit={createRole} className="form-card">
          <h3>Nuevo Rol</h3>
          <div className="form-group">
            <label>Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              required
              placeholder="Ej: Supervisor"
            />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              rows="3"
              placeholder="Describe las responsabilidades de este rol..."
            />
          </div>
          <button type="submit" className="btn-primary">Crear Rol</button>
        </form>
      )}

      <div className="roles-list">
        {rolesList.map(role => (
          <div key={role.id} className="role-card">
            {editingId === role.id ? (
              <form onSubmit={updateRole}>
                <div className="form-group">
                  <label>Nombre</label>
                  <input
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    rows="3"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">Guardar</button>
                  <button type="button" onClick={cancelEdit} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="role-header">
                  <h3>{role.nombre}</h3>
                  <span className="role-id">ID: {role.id}</span>
                </div>
                <p className="role-description">
                  {role.descripcion || 'Sin descripción'}
                </p>
                <div className="role-meta">
                  <small>Creado: {new Date(role.fecha_creacion).toLocaleDateString()}</small>
                </div>
                <div className="role-actions">
                  <button onClick={() => startEdit(role)} className="btn-small">
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => deleteRole(role.id)}
                    className="btn-small btn-danger"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="info-section">
        <h3>ℹ️ Roles Predefinidos</h3>
        <ul>
          <li><strong>Admin:</strong> Acceso completo al sistema</li>
          <li><strong>Gerente:</strong> Gestiona productos de su tienda (no puede eliminar premium ni cambiar categoría)</li>
          <li><strong>Empleado:</strong> Consulta y actualiza stock de su tienda (no puede crear premium ni eliminar)</li>
          <li><strong>Auditor:</strong> Solo lectura de todos los datos</li>
        </ul>
      </div>
    </div>
  )
}
