import { useState, useEffect, useRef } from 'react'

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : window.location.origin

/**
 * AuthModal — handles signup, login (password), and magic link.
 *
 * Props:
 *   onSuccess(session)  — called with { api_key, name, email, plan, js_enabled }
 *   onClose()           — called when user dismisses
 *   initialMode         — 'signup' | 'login' | 'magic'
 */
export function AuthModal({ onSuccess, onClose, initialMode = 'signup' }) {
  const [mode, setMode] = useState(initialMode) // signup | login | magic | magic_sent | signup_done
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const emailRef = useRef()

  useEffect(() => { emailRef.current?.focus() }, [mode])

  // ── Check for magic link token in URL on mount ──────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) verifyMagicToken(token)
  }, [])

  const clearState = () => { setError(''); setInfo('') }

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email required'); return }
    clearState(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password: password || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Signup failed')
      _saveSession(data)
      setMode('signup_done') // show beta thank-you before handing off to parent
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Email and password required'); return }
    clearState(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      _saveSession(data)
      onSuccess(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Email required'); return }
    clearState(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) throw new Error('Failed to send magic link')
      setMode('magic_sent')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const verifyMagicToken = async (token) => {
    clearState(); setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/magic-verify?token=${token}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Invalid or expired link')
      _saveSession(data)
      onSuccess(data)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    } catch (e) { setError(e.message); setMode('login') }
    finally { setLoading(false) }
  }

  const _saveSession = (data) => {
    localStorage.setItem('galuli_api_key', data.api_key)
    localStorage.setItem('galuli_email', data.email)
    localStorage.setItem('galuli_name', data.name)
    localStorage.setItem('galuli_plan', data.plan)
    localStorage.setItem('galuli_js_enabled', data.js_enabled ? '1' : '0')
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: 420, borderRadius: 20, padding: '40px 36px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', color: 'var(--muted)',
          fontSize: 20, cursor: 'pointer', lineHeight: 1,
        }}>✕</button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⬡</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--fg)' }}>galuli</div>
        </div>

        {/* ── Beta signup done ── */}
        {mode === 'signup_done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: 'var(--fg)' }}>You're on the list!</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
              Welcome to the Galuli beta. Yan will reach out to you at
            </p>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)', marginBottom: 16 }}>{email}</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              Usually within a day or two — personally, not a bot.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', padding: '13px 0', fontWeight: 700 }}
              onClick={() => {
                // Retrieve the saved session and pass it to the parent
                const savedKey = localStorage.getItem('galuli_api_key')
                const savedEmail = localStorage.getItem('galuli_email')
                const savedName = localStorage.getItem('galuli_name')
                const savedPlan = localStorage.getItem('galuli_plan') || 'free'
                onSuccess({ api_key: savedKey, email: savedEmail, name: savedName, plan: savedPlan })
              }}>
              Open your dashboard →
            </button>
          </div>
        )}

        {/* ── Magic sent state ── */}
        {mode === 'magic_sent' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: 'var(--fg)' }}>Check your email</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              We sent a login link to <strong style={{ color: 'var(--fg)' }}>{email}</strong>.<br />
              It expires in 15 minutes.
            </p>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setMode('login')}>
              ← Back to login
            </button>
          </div>
        )}

        {/* ── Loading token verify ── */}
        {mode !== 'magic_sent' && mode !== 'signup_done' && loading && !error && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>Verifying…</div>
          </div>
        )}

        {/* ── Main form ── */}
        {mode !== 'magic_sent' && mode !== 'signup_done' && !loading && (
          <>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid var(--border)' }}>
              {[['signup', 'Join beta'], ['login', 'Log in'], ['magic', '✉️ Magic link']].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); clearState() }}
                  style={{
                    flex: 1, padding: '10px 4px', fontSize: 13, fontWeight: 600,
                    background: 'none', border: 'none',
                    borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
                    color: mode === m ? 'var(--accent)' : 'var(--muted)',
                    cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Signup form */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Your name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Email</label>
                  <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Password <span style={{ opacity: 0.5 }}>(optional)</span></label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 chars"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14 }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '13px 0', fontWeight: 700, marginTop: 4 }} disabled={loading}>
                  {loading ? 'Joining…' : 'Join the beta →'}
                </button>
                <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                  Yan reviews every signup personally. No credit card required.{' '}
                  <a href="/about" style={{ color: 'var(--accent)' }}>Terms</a>.
                </p>
              </form>
            )}

            {/* Login form */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Email</label>
                  <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14 }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '13px 0', fontWeight: 700 }} disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in →'}
                </button>
                <button type="button" className="btn btn-ghost" style={{ padding: '10px 0', fontSize: 13 }}
                  onClick={() => { setMode('magic'); clearState() }}>
                  Forgot password? Use magic link →
                </button>
              </form>
            )}

            {/* Magic link form */}
            {mode === 'magic' && (
              <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 8px', lineHeight: 1.6 }}>
                  Enter your email and we'll send a one-click login link. No password needed.
                </p>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Email</label>
                  <input ref={emailRef} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14 }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '13px 0', fontWeight: 700 }} disabled={loading}>
                  {loading ? 'Sending…' : '✉️ Send magic link →'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Convenience hook ─────────────────────────────────────────────────────────
export function useAuth() {
  const apiKey = localStorage.getItem('galuli_api_key')
  const email = localStorage.getItem('galuli_email')
  const name = localStorage.getItem('galuli_name')
  const plan = localStorage.getItem('galuli_plan') || 'free'
  const jsEnabled = localStorage.getItem('galuli_js_enabled') === '1'

  const logout = () => {
    ['galuli_api_key', 'galuli_email', 'galuli_name', 'galuli_plan', 'galuli_js_enabled'].forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  return { apiKey, email, name, plan, jsEnabled, isLoggedIn: !!apiKey, logout }
}
