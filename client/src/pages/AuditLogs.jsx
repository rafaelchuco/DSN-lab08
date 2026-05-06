import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function AuditLogs({ token, roles }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    action: '',
    usuario_id: '',
    resource_type: ''
  })

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    try {
      setLoading(true)
      // Usar endpoint directo a la base de datos para obtener logs
      // En producción, deberías crear un endpoint específico /api/audit-logs
      const res = await axios.get('/api/users', { 
        headers: { Authorization: `Bearer ${token}` }
      })
      // Por ahora mostrar mensaje que el endpoint no existe
      setError('Endpoint de auditoría no implementado aún')
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
      setLoading(false)
    }
  }

  if (!roles.includes('Auditor') && !roles.includes('Admin')) {
    return <div className="access-denied">Solo Auditores y Admin pueden acceder a los logs</div>
  }

  if (loading) return <div className="loading">Cargando logs de auditoría...</div>

  return (
    <div className="audit-logs-page">
      <div className="page-header">
        <h1>📋 Auditoría del Sistema</h1>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="info-section" style={{ marginBottom: '24px' }}>
        <h3>ℹ️ Panel de Auditoría</h3>
        <p>Esta página mostrará todos los eventos y acciones del sistema para análisis y cumplimiento.</p>
        <p><strong>Información que se registra:</strong></p>
        <ul>
          <li>✅ Intentos de login exitosos y fallidos</li>
          <li>✅ Creación, modificación y eliminación de usuarios</li>
          <li>✅ Asignación de roles</li>
          <li>✅ CRUD de productos</li>
          <li>✅ Eventos MFA (habilitación, verificación, bloqueos)</li>
          <li>✅ Cambios en roles</li>
        </ul>
      </div>

      <div className="filters-section" style={{ 
        background: '#f6f8fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '24px' 
      }}>
        <h3>🔍 Filtros</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label>Acción</label>
            <select 
              value={filters.action} 
              onChange={e => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">Todas</option>
              <option value="login_success">Login Exitoso</option>
              <option value="login_failed">Login Fallido</option>
              <option value="register">Registro</option>
              <option value="mfa_enable">MFA Habilitado</option>
              <option value="mfa_success">MFA Exitoso</option>
              <option value="mfa_failed">MFA Fallido</option>
              <option value="mfa_blocked">MFA Bloqueado</option>
              <option value="user_create">Usuario Creado</option>
              <option value="user_update">Usuario Actualizado</option>
              <option value="user_delete">Usuario Eliminado</option>
              <option value="assign_role">Rol Asignado</option>
              <option value="product_create">Producto Creado</option>
              <option value="product_update">Producto Actualizado</option>
              <option value="product_delete">Producto Eliminado</option>
              <option value="role_create">Rol Creado</option>
              <option value="role_update">Rol Actualizado</option>
              <option value="role_delete">Rol Eliminado</option>
            </select>
          </div>
          <div>
            <label>Tipo de Recurso</label>
            <select 
              value={filters.resource_type} 
              onChange={e => setFilters({ ...filters, resource_type: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="User">Usuario</option>
              <option value="Role">Rol</option>
              <option value="Product">Producto</option>
              <option value="UserRole">Asignación Rol</option>
            </select>
          </div>
          <div>
            <label>Usuario ID</label>
            <input 
              type="number" 
              value={filters.usuario_id} 
              onChange={e => setFilters({ ...filters, usuario_id: e.target.value })}
              placeholder="ID del usuario"
            />
          </div>
        </div>
      </div>

      <div className="logs-section">
        <h3>📊 Logs Recientes</h3>
        <p style={{ color: '#656d76', marginBottom: '16px' }}>
          Para ver los logs reales, se necesita crear un endpoint API específico en el backend.
        </p>
        
        <div style={{ 
          background: '#fff', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          textAlign: 'center',
          color: '#656d76'
        }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
          <h3>Endpoint de Auditoría</h3>
          <p>Para implementar esta funcionalidad completa:</p>
          <ol style={{ textAlign: 'left', maxWidth: '500px', margin: '20px auto' }}>
            <li>Crear endpoint <code>GET /api/audit-logs</code> en el backend</li>
            <li>Implementar paginación y filtros</li>
            <li>Agregar permisos solo para Auditor y Admin</li>
            <li>Conectar este frontend con el endpoint</li>
          </ol>
          
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            background: '#ddf4ff', 
            borderRadius: '6px',
            textAlign: 'left'
          }}>
            <strong>💡 Nota:</strong> Los logs ya se están guardando en la tabla <code>audit_logs</code> 
            en PostgreSQL. Solo falta exponerlos via API.
          </div>
        </div>
      </div>

      <div className="example-logs" style={{ marginTop: '24px' }}>
        <h3>📝 Ejemplo de Logs</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Recurso</th>
              <th>Detalles</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-05-06 14:30:50</td>
              <td>admin@techstore.com</td>
              <td>user_create</td>
              <td>User #5</td>
              <td>{`{"email":"auditor@techstore.com"}`}</td>
              <td>172.19.0.1</td>
            </tr>
            <tr>
              <td>2026-05-06 14:30:48</td>
              <td>auditor@techstore.com</td>
              <td>login_success</td>
              <td>User #5</td>
              <td>{`{}`}</td>
              <td>172.19.0.1</td>
            </tr>
            <tr style={{ background: '#ffebe9' }}>
              <td>2026-05-06 14:25:12</td>
              <td>empleado@techstore.com</td>
              <td>login_failed</td>
              <td>User #4</td>
              <td>{`{"reason":"invalid_password"}`}</td>
              <td>172.19.0.1</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
