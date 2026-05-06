import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Products({ token, roles = [], user, onLogout }) {
  const [products, setProducts] = useState([])
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ nombre: '', tienda_id: '', precio: 0, stock: 0, es_premium: false })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    fetchProducts()
  }, [])

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
    // client-side validation
    if (!form.nombre) return setError('El nombre es requerido')
    if (!form.tienda_id) return setError('La tienda es requerida')
    if (Number(form.precio) < 0) return setError('El precio debe ser >= 0')
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) return setError('Stock inválido')
    try {
      const res = await axios.post('/api/products', form, { headers: { Authorization: `Bearer ${token}` } })
      setProducts(prev => [res.data, ...prev])
      setForm({ nombre: '', tienda_id: '', precio: 0, stock: 0, es_premium: false })
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  async function deleteProduct(id) {
    if (!confirm('Eliminar producto?')) return
    try {
      await axios.delete(`/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setProducts(prev => prev.filter(p => p.id !== id))
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
    // basic validation
    if (editForm.precio && Number(editForm.precio) < 0) return setError('El precio debe ser >= 0')
    if (editForm.stock && (!Number.isInteger(Number(editForm.stock)) || Number(editForm.stock) < 0)) return setError('Stock inválido')
    try {
      const res = await axios.put(`/api/products/${editId}`, editForm, { headers: { Authorization: `Bearer ${token}` } })
      setProducts(prev => prev.map(p => p.id === res.data.id ? res.data : p))
      setEditId(null)
      setEditForm({})
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h2>Productos</h2>
        <button onClick={onLogout}>Cerrar sesión</button>
      </div>
      {error && <div className="error">{error}</div>}
      {canCreate && (
        <form onSubmit={createProduct} style={{ marginBottom: 12 }}>
          <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          <input placeholder="Tienda ID" value={form.tienda_id} onChange={e => setForm({ ...form, tienda_id: e.target.value })} />
          <input placeholder="Precio" type="number" value={form.precio} onChange={e => setForm({ ...form, precio: Number(e.target.value) })} />
          <input placeholder="Stock" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
          <label><input type="checkbox" checked={form.es_premium} onChange={e => setForm({ ...form, es_premium: e.target.checked })} /> Premium</label>
          <button type="submit">Crear producto</button>
        </form>
      )}

      <ul>
        {products.map(p => {
          const canDelete = roles.includes('Admin') || (roles.includes('Gerente') && String(p.tienda_id) === String(user?.tienda_id) && !p.es_premium)
          const canEdit = roles.includes('Admin') || (roles.includes('Gerente') && String(p.tienda_id) === String(user?.tienda_id)) || (roles.includes('Empleado') && String(p.tienda_id) === String(user?.tienda_id))
          return (
            <li key={p.id} style={{ marginBottom: 8 }}>
              {editId === p.id ? (
                <form onSubmit={submitEdit}>
                  {/* For Empleado only allow stock */}
                  {roles.includes('Empleado') && !roles.includes('Admin') && !roles.includes('Gerente') ? (
                    <input type="number" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })} />
                  ) : (
                    <>
                      <input value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} />
                      <input value={editForm.precio} type="number" onChange={e => setEditForm({ ...editForm, precio: Number(e.target.value) })} />
                      <input value={editForm.stock} type="number" onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })} />
                      {/* Gerente cannot change categoria according to ABAC */}
                      {roles.includes('Admin') && (
                        <input value={editForm.categoria} onChange={e => setEditForm({ ...editForm, categoria: e.target.value })} />
                      )}
                    </>
                  )}
                  <button type="submit">Guardar</button>
                  <button type="button" onClick={() => setEditId(null)}>Cancelar</button>
                </form>
              ) : (
                <>
                  <strong>{p.nombre}</strong> — {p.tienda_id} — ${p.precio} — stock: {p.stock}
                  {canEdit && <button style={{ marginLeft: 8 }} onClick={() => startEdit(p)}>Editar</button>}
                  {canDelete && <button style={{ marginLeft: 8 }} onClick={() => deleteProduct(p.id)}>Eliminar</button>}
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
