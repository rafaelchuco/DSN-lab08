import React, { useEffect, useState } from 'react'
import axios from 'axios'
import MFAModal from '../components/MFAModal'

export default function Dashboard({ token, user, roles, onUserRefresh }) {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    premiumProducts: 0,
    totalUsers: 0,
    byCategory: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showMFAModal, setShowMFAModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const headers = { Authorization: `Bearer ${token}` }
      
      // Obtener productos
      const productsRes = await axios.get('/api/products', { headers })
      const products = productsRes.data
      
      // Calcular estadísticas
      const byCategory = {}
      products.forEach(p => {
        byCategory[p.categoria || 'Sin categoría'] = (byCategory[p.categoria || 'Sin categoría'] || 0) + 1
      })
      
      setStats({
        totalProducts: products.length,
        lowStock: products.filter(p => p.stock < 10).length,
        premiumProducts: products.filter(p => p.es_premium).length,
        byCategory
      })
      
      // Si es Admin, obtener usuarios
      if (roles.includes('Admin')) {
        const usersRes = await axios.get('/api/users', { headers })
        setStats(prev => ({ ...prev, totalUsers: usersRes.data.length }))
      }
      
      setLoading(false)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Cargando estadísticas...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <p>Bienvenido, {user?.nombre_completo || 'Usuario'}</p>
        {user?.tienda_id && <p className="tienda-info">Tienda: <strong>{user.tienda_id}</strong></p>}
        <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className={`badge ${user?.mfa_enabled ? 'active' : 'inactive'}`}>
            MFA {user?.mfa_enabled ? 'Activo' : 'Inactivo'}
          </span>
          <button
            onClick={() => setShowMFAModal(true)}
            className={`btn-mfa ${user?.mfa_enabled ? 'active' : ''}`}
          >
            {user?.mfa_enabled ? 'Desactivar MFA' : 'Activar MFA'}
          </button>
        </div>
        {user?.mfa_required && !user?.mfa_enabled && (
          <div className="error" style={{ marginTop: '10px' }}>
            Tu administrador exige MFA para esta cuenta. Activa MFA para cumplir la política.
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Productos</h3>
            <p className="stat-number">{stats.totalProducts}</p>
            <p className="stat-label">
              {roles.includes('Admin') || roles.includes('Auditor') 
                ? 'En todas las tiendas' 
                : `En tienda ${user?.tienda_id || '-'}`}
            </p>
          </div>
        </div>

        <div className="stat-card alert">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Stock Bajo</h3>
            <p className="stat-number">{stats.lowStock}</p>
            <p className="stat-label">Menos de 10 unidades</p>
          </div>
        </div>

        <div className="stat-card premium">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Productos Premium</h3>
            <p className="stat-number">{stats.premiumProducts}</p>
            <p className="stat-label">Requieren permisos especiales</p>
          </div>
        </div>

        {roles.includes('Admin') && (
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Total Usuarios</h3>
              <p className="stat-number">{stats.totalUsers}</p>
              <p className="stat-label">En el sistema</p>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Productos por Categoría</h2>
        <div className="category-list">
          {Object.entries(stats.byCategory).map(([cat, count]) => (
            <div key={cat} className="category-item">
              <span className="category-name">{cat}</span>
              <span className="category-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {(roles.includes('Gerente') || roles.includes('Empleado')) && (
        <div className="dashboard-info">
          <h3>ℹ️ Tus Permisos</h3>
          <ul>
            {roles.includes('Gerente') && (
              <>
                <li>✅ Crear y actualizar productos en tu tienda</li>
                <li>✅ Eliminar productos NO premium</li>
                <li>❌ No puedes modificar la categoría</li>
              </>
            )}
            {roles.includes('Empleado') && (
              <>
                <li>✅ Ver productos de tu tienda</li>
                <li>✅ Actualizar SOLO el stock</li>
                <li>✅ Crear productos NO premium</li>
                <li>❌ No puedes eliminar productos</li>
              </>
            )}
          </ul>
        </div>
      )}

      {showMFAModal && user && (
        <MFAModal
          token={token}
          user={user}
          onClose={() => setShowMFAModal(false)}
          onSuccess={async () => {
            setShowMFAModal(false)
            await fetchDashboardData()
            if (onUserRefresh) await onUserRefresh()
          }}
        />
      )}
    </div>
  )
}
