import React, { useState } from 'react'
import Login from './pages/Login'
import MFA from './pages/MFA'
import Products from './pages/Products'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [mfaTempToken, setMfaTempToken] = useState(null)
  const [roles, setRoles] = useState([])
  const [user, setUser] = useState(null)

  // fetch user info when token changes
  React.useEffect(() => {
    async function fetchMe() {
      if (!token) return setRoles([])
      try {
        const res = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (res.ok) setRoles(data.roles || [])
        if (res.ok) setUser(data.user || null)
      } catch (err) {
        setRoles([])
      }
    }
    fetchMe()
  }, [token])

  function handleLoginSuccess(tkn) {
    if (tkn.mfa_required) {
      setMfaTempToken(tkn.token)
      return
    }
    localStorage.setItem('token', tkn.token)
    setToken(tkn.token)
  }

  function handleMfaSuccess(fullToken) {
    localStorage.setItem('token', fullToken)
    setToken(fullToken)
    setMfaTempToken(null)
  }

  if (!token && mfaTempToken) {
    return <MFA tempToken={mfaTempToken} onSuccess={handleMfaSuccess} />
  }

  if (!token) return <Login onLogin={handleLoginSuccess} />

  return <Products token={token} roles={roles} user={user} onLogout={() => { localStorage.removeItem('token'); setToken(null); setRoles([]); setUser(null) }} />
}
