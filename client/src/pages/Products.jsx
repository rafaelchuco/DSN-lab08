import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Products({ token, roles = [], user, onLogout }) {
  const [products, setProducts] = useState([])
  const [stores, setStores] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState({ nombre: '', categoria: '', tienda_id: '', precio: 0, stock: 0, es_premium: false, descripcion: '' })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchStores()
  }, [])

  async function fetchStores() {
    try {
      const res = await axios.get('/api/products/stores/list', { headers: { Authorization: `Bearer ${token}` } })
      setStores(res.data.stores || [])
    } catch (err) {
      console.error('Error fetching stores:', err.response?.data?.error || err.message)
    }
  }

  async function fetchProducts() {
    try {
      const res = await axios.get('/api/products', { headers: { Authorization: `Bearer ${token}` } })
      setProducts(res.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  const canCreate = roles.includes('Admin') || roles.includes('Gerente') || roles.includes('Empleado')

  async function createProduct(e) {
    e.preventDefault()
    if (!form.nombre) return setError('El nombre es requerido')
    if (!form.tienda_id) return setError('La tienda es requerida')
    if (Number(form.precio) < 0) return setError('El precio debe ser >= 0')
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) return setError('Stock inválido')
    try {
      const res = await axios.post('/api/products', form, { headers: { Authorization: `Bearer ${token}` } })
      setProducts(prev => [res.data, ...prev])
      setForm({ nombre: '', categoria: '', tienda_id: '', precio: 0, stock: 0, es_premium: false, descripcion: '' })
      setShowForm(false)
      setSuccess('Producto creado exitosamente')
      setTimeout(() => setSuccess(null), 3000)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await axios.delete(`/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setProducts(prev => prev.filter(p => p.id !== id))
      setSuccess('Producto eliminado')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  function startEdit(p) {
    setEditId(p.id)
    setEditForm({ nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, stock: p.stock, categoria: p.categoria, es_premium: p.es_premium })
  }

  async function submitEdit(e) {
    e.preventDefault()
    if (editForm.precio && Number(editForm.precio) < 0) return setError('El precio debe ser >= 0')
    if (editForm.stock && (!Number.isInteger(Number(editForm.stock)) || Number(editForm.stock) < 0)) return setError('Stock inválido')
    try {
      const res = await axios.put(`/api/products/${editId}`, editForm, { headers: { Authorization: `Bearer ${token}` } })
      setProducts(prev => prev.map(p => p.id === res.data.id ? res.data : p))
      setEditId(null)
      setEditForm({})
      setSuccess('Producto actualizado')
      setTimeout(() => setSuccess(null), 3000)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(filter.toLowerCase()) || 
    p.categoria?.toLowerCase().includes(filter.toLowerCase()) ||
    String(p.tienda_id).includes(filter)
  )

  const lowStockProducts = filteredProducts.filter(p => p.stock < 10).length
  const premiumProducts = filteredProducts.filter(p => p.es_premium).length

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>📦 Gestión de Productos</h1>
          <p>Total: <strong>{filteredProducts.length}</strong> | Stock bajo: <strong>{lowStockProducts}</strong> | Premium: <strong>{premiumProducts}</strong></p>
        </div>
        <button onClick={onLogout} className="btn-logout">🚪 Cerrar sesión</button>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {canCreate && (
        <div className="form-section">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? '✕ Cancelar' : '+ Crear Producto'}
          </button>
          
          {showForm && (
            <form onSubmit={createProduct} className="product-form">
              <div className="form-grid">
                <div>
                  <label>Nombre *</label>
                  <input 
                    type="text"
                    placeholder="Ej: Laptop Gaming" 
                    value={form.nombre} 
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Categoría</label>
                  <input 
                    type="text"
                    placeholder="Ej: Electrónica" 
                    value={form.categoria} 
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                  />
                </div>
                <div>
                  <label>Tienda *</label>
                  <select 
                    value={form.tienda_id} 
                    onChange={e => setForm({ ...form, tienda_id: e.target.value })}
                    required
                  >
                    <option value="">Selecciona tienda</option>
                    {stores.map(store => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Precio ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={form.precio} 
                    onChange={e => setForm({ ...form, precio: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label>Stock *</label>
                  <input 
                    type="number" 
                    min="0"
                    value={form.stock} 
                    onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={form.es_premium} 
                      onChange={e => setForm({ ...form, es_premium: e.target.checked })}
                    />
                    👑 Producto Premium
                  </label>
                </div>
              </div>
              <div className="form-full">
                <label>Descripción</label>
                <textarea 
                  placeholder="Describe el producto..."
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-success">✓ Crear</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="search-section">
        <input 
          type="text"
          placeholder="🔍 Buscar por nombre, categoría o tienda..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-container">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>📭 No hay productos disponibles</p>
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Tienda</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const canDelete = roles.includes('Admin') || (roles.includes('Gerente') && String(p.tienda_id) === String(user?.tienda_id) && !p.es_premium)
                const canEdit = roles.includes('Admin') || (roles.includes('Gerente') && String(p.tienda_id) === String(user?.tienda_id)) || (roles.includes('Empleado') && String(p.tienda_id) === String(user?.tienda_id))
                const stockStatus = p.stock < 5 ? 'crítico' : p.stock < 10 ? 'bajo' : 'ok'
                
                return (
                  <tr key={p.id} className={editId === p.id ? 'editing' : ''}>
                    {editId === p.id ? (
                      <>
                        <td colSpan="7">
                          <form onSubmit={submitEdit} className="inline-edit-form">
                            <div className="edit-grid">
                              <input value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} placeholder="Nombre" />
                              {roles.includes('Admin') && (
                                <input value={editForm.categoria} onChange={e => setEditForm({ ...editForm, categoria: e.target.value })} placeholder="Categoría" />
                              )}
                              {roles.includes('Admin') && (
                                <input value={editForm.precio} type="number" onChange={e => setEditForm({ ...editForm, precio: Number(e.target.value) })} placeholder="Precio" />
                              )}
                              <input value={editForm.stock} type="number" onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })} placeholder="Stock" />
                              <div style={{display:'flex', gap:'8px'}}>
                                <button type="submit" className="btn-success">✓ Guardar</button>
                                <button type="button" onClick={() => setEditId(null)} className="btn-secondary">✕ Cancelar</button>
                              </div>
                            </div>
                          </form>
                        </td>
                      </>
                    ) : (
                      <>
                        <td><strong>{p.nombre}</strong></td>
                        <td>{p.categoria || '-'}</td>
                        <td><span className="badge">{p.tienda_id}</span></td>
                        <td><strong>${Number(p.precio).toFixed(2)}</strong></td>
                        <td>
                          <span className={`stock-badge stock-${stockStatus}`}>{p.stock} unid.</span>
                        </td>
                        <td>
                          {p.es_premium && <span className="badge-premium">👑 Premium</span>}
                          {stockStatus === 'crítico' && <span className="badge-danger">⚠️ Crítico</span>}
                          {stockStatus === 'bajo' && <span className="badge-warning">⚠️ Bajo</span>}
                        </td>
                        <td className="actions-cell">
                          {canEdit && <button onClick={() => startEdit(p)} className="btn-edit">✏️ Editar</button>}
                          {canDelete && <button onClick={() => deleteProduct(p.id)} className="btn-delete">🗑️ Eliminar</button>}
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
