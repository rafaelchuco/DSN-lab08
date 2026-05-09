import React, { useState } from 'react'
import axios from 'axios'

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email)
}

const testUsers = [
  { role: '👑 Admin', email: 'admin@techstore.com', password: 'Admin123!' },
  { role: '👔 Gerente', email: 'gerente@techstore.com', password: 'Gerente123!' },
  { role: '👔 Gerente', email: 'gerente.arequipa@techstore.com', password: 'Gerente123!' },
  { role: '🛒 Empleado', email: 'empleado@techstore.com', password: 'Empleado123!' },
  { role: '🛒 Empleado', email: 'empleado.cusco@techstore.com', password: 'Empleado123!' },
  { role: '📋 Auditor', email: 'auditor@techstore.com', password: 'Auditor123!' },
]

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState(null)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

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

  const fillCredentials = (email, password) => {
    setEmail(email)
    setPassword(password)
    setError(null)
    setInfo(null)
  }

  const copyToClipboard = (text, idx, field) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setCopiedField(field)
    setTimeout(() => {
      setCopiedIdx(null)
      setCopiedField(null)
    }, 2000)
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div className="container" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '16px', textAlign: 'center' }}>🔐 Acceso TechStore Pro</h2>
        {error && <div className="error">{error}</div>}
        {info && <div style={{ background: '#e6f7ff', color: '#024', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontWeight: 500 }}>{info}</div>}
        <form onSubmit={submit}>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} disabled={loading} placeholder="correo@ejemplo.com" />
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} placeholder="••••••••" />
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '12px' }}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
      </div>

      <div className="dashboard-section" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: 700 }}>📋 Usuarios de Prueba</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>Haz clic en cualquier usuario para cargar sus credenciales automáticamente:</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {testUsers.map((user, idx) => (
            <div 
              key={idx} 
              onClick={() => fillCredentials(user.email, user.password)}
              style={{
                padding: '14px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'var(--primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'var(--border-light)'
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--primary)' }}>{user.role}</div>
              
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Email:</div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)', wordBreak: 'break-all', flex: 1 }}>{user.email}</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(user.email, idx, 'email')
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    background: copiedIdx === idx && copiedField === 'email' ? 'var(--success)' : 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => {
                    if (copiedIdx !== idx || copiedField !== 'email') {
                      e.target.style.opacity = '0.8'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1'
                  }}
                >
                  {copiedIdx === idx && copiedField === 'email' ? '✓ Copiado' : '📋 Copiar'}
                </button>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Contraseña:</div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)', flex: 1 }}>{user.password}</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(user.password, idx, 'password')
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    background: copiedIdx === idx && copiedField === 'password' ? 'var(--success)' : 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => {
                    if (copiedIdx !== idx || copiedField !== 'password') {
                      e.target.style.opacity = '0.8'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.opacity = '1'
                  }}
                >
                  {copiedIdx === idx && copiedField === 'password' ? '✓ Copiado' : '📋 Copiar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
