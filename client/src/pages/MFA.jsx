import React, { useState } from 'react'
import axios from 'axios'

export default function MFA({ tempToken, onSuccess }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    if (!/^[0-9]{6}$/.test(code)) return setError('El código debe tener 6 dígitos numéricos')
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/mfa/verify', { token: tempToken, code })
      setLoading(false)
      onSuccess(res.data.token)
    } catch (err) {
      setLoading(false)
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="container">
      <h2>MFA - Ingresa tu código</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        <label>Código</label>
        <input value={code} onChange={e => setCode(e.target.value)} disabled={loading} />
        <button type="submit" disabled={loading}>{loading ? 'Verificando...' : 'Verificar'}</button>
      </form>
    </div>
  )
}
