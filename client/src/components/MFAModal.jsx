import React, { useState, useEffect } from 'react'
import axios from 'axios'
import QRCode from 'qrcode'

export default function MFAModal({ token, user, onClose, onSuccess }) {
  const [step, setStep] = useState(user.mfa_enabled ? 'disable' : 'enable') // enable, qr, verify, disable
  const [qrData, setQrData] = useState(null)
  const [qrImage, setQrImage] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [secret, setSecret] = useState(null)

  async function handleEnable() {
    setError(null)
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/mfa/enable', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setQrData(res.data.secret) // otpauth://totp/...
      setSecret(res.data.base32)
      setStep('qr')
      setLoading(false)
    } catch (err) {
      setLoading(false)
      setError(err.response?.data?.error || err.message)
    }
  }

  useEffect(() => {
    if (qrData) {
      QRCode.toDataURL(qrData, { width: 300 })
        .then(url => setQrImage(url))
        .catch(err => setError('Error generando QR: ' + err.message))
    }
  }, [qrData])

  async function handleVerifySetup() {
    if (!/^[0-9]{6}$/.test(code)) {
      setError('El código debe tener 6 dígitos')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await axios.post('/api/auth/mfa/verify-setup', { code }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLoading(false)
      onSuccess()
      onClose()
    } catch (err) {
      setLoading(false)
      setError(err.response?.data?.error || err.message)
    }
  }

  async function handleDisable() {
    if (!/^[0-9]{6}$/.test(code)) {
      setError('El código debe tener 6 dígitos')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await axios.post('/api/auth/mfa/disable', { code }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLoading(false)
      onSuccess()
      onClose()
    } catch (err) {
      setLoading(false)
      setError(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {step === 'enable' && (
          <>
            <h2>🔐 Habilitar Autenticación de Dos Factores (MFA)</h2>
            <div className="modal-body">
              <p>La autenticación de dos factores agrega una capa adicional de seguridad a tu cuenta.</p>
              <ul style={{ textAlign: 'left', margin: '20px 0' }}>
                <li>Necesitarás una aplicación de autenticación (Google Authenticator, Authy, Microsoft Authenticator)</li>
                <li>Deberás escanear un código QR</li>
                <li>Cada vez que inicies sesión, deberás ingresar un código de 6 dígitos</li>
              </ul>
              {error && <div className="error">{error}</div>}
              <div className="modal-actions">
                <button onClick={handleEnable} disabled={loading}>
                  {loading ? 'Generando...' : 'Continuar'}
                </button>
                <button onClick={onClose} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </>
        )}

        {step === 'qr' && (
          <>
            <h2>📱 Escanea el Código QR</h2>
            <div className="modal-body">
              <div style={{ background: '#ddf4ff', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                <strong>👤 Cuenta:</strong> {user?.nombre_completo || 'Usuario'}
              </div>
              <p>Abre tu aplicación de autenticación y escanea este código QR:</p>
              {qrImage && (
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <img src={qrImage} alt="QR Code" style={{ maxWidth: '300px' }} />
                </div>
              )}
              {secret && (
                <div style={{ background: '#f6f8fa', padding: '12px', borderRadius: '6px', marginTop: '16px' }}>
                  <strong>Código manual (si no puedes escanear):</strong>
                  <div style={{ fontFamily: 'monospace', marginTop: '8px', fontSize: '14px', wordBreak: 'break-all' }}>
                    {secret}
                  </div>
                </div>
              )}
              <div className="modal-actions" style={{ marginTop: '24px' }}>
                <button onClick={() => setStep('verify')}>
                  He escaneado el código
                </button>
                <button onClick={onClose} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </>
        )}

        {step === 'verify' && (
          <>
            <h2>✅ Verificar Configuración</h2>
            <div className="modal-body">
              <p>Ingresa el código de 6 dígitos que aparece en tu aplicación de autenticación:</p>
              {error && <div className="error">{error}</div>}
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                style={{ 
                  fontSize: '24px', 
                  textAlign: 'center', 
                  letterSpacing: '8px',
                  margin: '20px 0' 
                }}
                disabled={loading}
              />
              <div className="modal-actions">
                <button onClick={handleVerifySetup} disabled={loading || code.length !== 6}>
                  {loading ? 'Verificando...' : 'Verificar y Activar'}
                </button>
                <button onClick={() => setStep('qr')} className="btn-secondary" disabled={loading}>
                  Volver
                </button>
                <button onClick={onClose} className="btn-secondary" disabled={loading}>
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'disable' && (
          <>
            <h2>⚠️ Desactivar MFA</h2>
            <div className="modal-body">
              <p>Para desactivar la autenticación de dos factores, ingresa tu código actual:</p>
              <div style={{ background: '#fff3cd', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                <strong>⚠️ Advertencia:</strong> Tu cuenta será menos segura sin MFA.
              </div>
              {error && <div className="error">{error}</div>}
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                style={{ 
                  fontSize: '24px', 
                  textAlign: 'center', 
                  letterSpacing: '8px',
                  margin: '20px 0' 
                }}
                disabled={loading}
              />
              <div className="modal-actions">
                <button 
                  onClick={handleDisable} 
                  disabled={loading || code.length !== 6}
                  style={{ background: '#d73a49' }}
                >
                  {loading ? 'Desactivando...' : 'Desactivar MFA'}
                </button>
                <button onClick={onClose} className="btn-secondary" disabled={loading}>
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
