import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export function LoginPage({ onAuth }) {
  const [mode, setMode]         = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [ready, setReady]       = useState(false)

  const { login, register, loading, authError, clearError } = useAuthStore()

  useEffect(() => { setTimeout(() => setReady(true), 60) }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    clearError()
    const ok = mode === 'login'
      ? await login(username, password)
      : await register(username, email, password)
    if (ok) onAuth()
  }

  function switchMode() {
    setMode(m => m === 'login' ? 'register' : 'login')
    clearError()
    setPassword('')
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    color: 'var(--text-1)',
    fontSize: 13,
    fontFamily: 'inherit',
    padding: '10px 12px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  }

  function handleFocus(e) {
    e.target.style.borderColor = 'var(--border-accent)'
    e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)'
  }

  function handleBlur(e) {
    e.target.style.borderColor = 'var(--border)'
    e.target.style.boxShadow = 'none'
  }

  const labelStyle = {
    display: 'block',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-4)',
    marginBottom: 6,
    fontFamily: "'JetBrains Mono', monospace",
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#040408',
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: 380,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-2xl)',
        padding: '36px 32px 32px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
        transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo + header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-lg)',
            background: 'linear-gradient(135deg, #8b5cf6, #5b21b6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            boxShadow: '0 0 28px rgba(124,58,237,0.5), 0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <span style={{ color: 'white', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>N</span>
          </div>
          <h1 style={{
            fontSize: 18, fontWeight: 700, color: 'var(--text-1)',
            letterSpacing: '-0.03em', margin: 0,
          }}>
            {mode === 'login' ? 'Sign in to Nexus' : 'Create account'}
          </h1>
          <p style={{
            fontSize: 12, color: 'var(--text-3)',
            marginTop: 5, margin: '5px 0 0',
          }}>
            {mode === 'login' ? 'Access your security toolkit' : 'Get started with Nexus'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Username */}
          <div>
            <label style={labelStyle}>Username</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="your-username" autoComplete="username" required
              style={inputStyle}
              onFocus={handleFocus} onBlur={handleBlur}
            />
          </div>

          {/* Email (register only) */}
          {mode === 'register' && (
            <div>
              <label style={labelStyle}>
                Email{' '}
                <span style={{ color: 'var(--text-5)', textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" type="email"
                style={inputStyle}
                onFocus={handleFocus} onBlur={handleBlur}
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                value={password} onChange={e => setPassword(e.target.value)}
                type={showPass ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                style={{ ...inputStyle, paddingRight: 48 }}
                onFocus={handleFocus} onBlur={handleBlur}
              />
              <button
                type="button" onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-4)',
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: 'color 0.1s',
                  padding: '2px 4px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}>
                {showPass ? 'hide' : 'show'}
              </button>
            </div>
          </div>

          {/* Error */}
          {authError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', borderRadius: 'var(--r-lg)',
              background: 'rgba(255,71,87,0.07)',
              border: '1px solid rgba(255,71,87,0.25)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{authError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '11px 0', marginTop: 2,
              borderRadius: 'var(--r-md)',
              background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #8b5cf6, #5b21b6)',
              color: 'white', fontSize: 13, fontWeight: 700,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(124,58,237,0.5), 0 2px 8px rgba(0,0,0,0.4)',
              transition: 'all 0.15s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 32px rgba(124,58,237,0.7), 0 2px 8px rgba(0,0,0,0.5)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,58,237,0.5), 0 2px 8px rgba(0,0,0,0.4)' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{
                  width: 13, height: 13, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                {mode === 'login' ? 'Signing in...' : 'Creating...'}
              </span>
            ) : (
              mode === 'login' ? 'Sign in' : 'Create account'
            )}
          </button>
        </form>

        {/* Switch mode */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 20, margin: '20px 0 0' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={switchMode}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--accent-light)', fontSize: 12, fontWeight: 600,
              padding: 0, transition: 'color 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--accent-light)'}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  )
}
