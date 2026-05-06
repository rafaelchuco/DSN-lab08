import React, { useState } from 'react'
import axios from 'axios'

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email)
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!validateEmail(email)) return setError('Formato de email inválido')
    if (!password || password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/login', { email, password })
      setLoading(false)
      if (res.data.mfa_required) {
        setInfo('Se requiere MFA. Ingresa el código enviado.')
      }
      onLogin(res.data)
    } catch (err) {
      setLoading(false)
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="container">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      {info && <div style={{ background: '#e6f7ff', color: '#024', padding:8, borderRadius:4 }}>{info}</div>}
      <form onSubmit={submit}>
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
        <label>Contraseña</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
        <button type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
    </div>
  )
}
