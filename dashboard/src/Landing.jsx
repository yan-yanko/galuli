import { useState, useEffect, useRef } from 'react'
import { GaluMascot } from './Galu.jsx'

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : window.location.origin

async function scanSite(url) {
  const res = await fetch(`${API_BASE}/api/v1/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, force_refresh: false, max_pages: 5 }),
  })
  if (!res.ok) throw new Error('Scan failed')
  return res.json()
}

async function pollJob(jobId) {
  const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`)
  if (!res.ok) throw new Error('Poll failed')
  return res.json()
}

async function getScore(domain) {
  const res = await fetch(`${API_BASE}/api/v1/score/${domain}`)
  if (!res.ok) throw new Error('Score not found')
  return res.json()
}

async function getRegistry(domain) {
  const res = await fetch(`${API_BASE}/registry/${domain}`)
  if (!res.ok) throw new Error('Registry not found')
  return res.json()
}

// ── Shared ────────────────────────────────────────────────────────────────────
export function ScoreRingLanding({ score, size = 80, accentColor }) {
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'
  const defaultColor = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--blue)' : score >= 40 ? 'var(--yellow)' : 'var(--red)'
  const color = accentColor || defaultColor
  const r = size / 2 - 7
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.14, color: 'var(--subtle)', marginTop: 2 }}>{grade}</span>
      </div>
    </div>
  )
}

// ── Top nav (shared between landing + results) ─────────────────────────────
function LandingNav({ onSignIn }) {
  return (
    <nav className="landing-nav" style={{
      height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 64px', borderBottom: '1px solid var(--border)',
      background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, color: 'var(--text)', textDecoration: 'none', letterSpacing: '-0.3px' }}>
        <div style={{ width: 22, height: 22, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 800, flexShrink: 0 }}>g</div>
        galuli
      </a>
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <div className="nav-links-desktop" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <a href="/blog"    className="btn btn-ghost btn-sm" style={{ color: 'var(--subtle)' }}>Blog</a>
          <a href="/about"   className="btn btn-ghost btn-sm" style={{ color: 'var(--subtle)' }}>About</a>
          <a href="/pricing" className="btn btn-ghost btn-sm" style={{ color: 'var(--subtle)' }}>Pricing</a>
        </div>
        <a href="/pricing" className="btn btn-primary btn-sm" style={{ marginLeft: 6 }}>Join the beta →</a>
      </div>
    </nav>
  )
}

// ── Scan animation (terminal style) ──────────────────────────────────────────
function ScanAnimation({ url, progress }) {
  const steps = [
    { label: 'Crawling pages', threshold: 20 },
    { label: 'AI comprehension (4 passes)', threshold: 60 },
    { label: 'Extracting capabilities', threshold: 75 },
    { label: 'Calculating Score', threshold: 90 },
  ]
  const activeStep = steps.reduce((acc, s, i) => progress >= s.threshold ? i : acc, -1)
  const pagesFound = Math.floor((progress / 100) * 18)
  const logs = [
    { at: 5,  text: `GET /${url.replace(/https?:\/\//, '')} → 200` },
    { at: 12, text: 'Sitemap found · 18 URLs queued' },
    { at: 22, text: 'Crawled /about → 420 tokens' },
    { at: 35, text: 'Crawled /pricing → 318 tokens' },
    { at: 48, text: 'Pass 1/4 · Content extraction complete' },
    { at: 58, text: 'Pass 2/4 · Capability mapping complete' },
    { at: 66, text: 'Pass 3/4 · Structure analysis complete' },
    { at: 74, text: 'Pass 4/4 · Intent classification done' },
    { at: 82, text: '7 capabilities identified' },
    { at: 91, text: 'Computing AI Readiness Score…' },
  ].filter(l => l.at <= progress)

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', fontFamily: 'var(--font-mono)' }}>
      {/* Terminal bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
        {['#e5484d','#d9a53a','#4aad52'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--font)' }}>galuli scanner</div>
      </div>

      <div style={{ padding: '12px 14px 0' }}>
        {/* URL + pages */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600 }}>{url.replace(/https?:\/\//, '')}</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--subtle)' }}>{pagesFound} pages</div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--subtle)', marginBottom: 4 }}>
          <span>PROGRESS</span>
          <span style={{ color: 'var(--accent)' }}>{progress}%</span>
        </div>
        <div style={{ background: 'var(--border)', borderRadius: 3, height: 3, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent)', width: `${progress}%`, transition: 'width 0.8s ease' }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10, fontFamily: 'var(--font)' }}>
          {steps.map((s, i) => {
            const done = progress >= s.threshold
            const active = !done && i === activeStep + 1
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: done || active ? 1 : 0.3 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  background: done ? 'rgba(74,173,82,0.1)' : 'var(--surface2)',
                  border: `1px solid ${done ? 'rgba(74,173,82,0.3)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
                }}>
                  {done ? <span style={{ color: 'var(--green)' }}>✓</span>
                    : active ? <span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} />
                    : <span style={{ color: 'var(--subtle)' }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: 11, color: done ? 'var(--green)' : active ? 'var(--accent2)' : 'var(--muted)', fontWeight: done || active ? 500 : 400 }}>
                  {s.label}
                </span>
                {done && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--subtle)' }}>done</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Log output */}
      <div style={{ margin: '0 14px 12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', height: 72, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
        {logs.slice(-5).map((l, i) => (
          <div key={l.at} style={{ fontSize: 10, color: i === logs.slice(-5).length - 1 ? 'var(--accent2)' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: 'var(--border2)', marginRight: 5 }}>›</span>{l.text}
          </div>
        ))}
        <div style={{ fontSize: 10, color: 'var(--accent)', animation: 'crawl-blink 1s step-end infinite' }}>▋</div>
      </div>
    </div>
  )
}

// ── Animated stat counter ─────────────────────────────────────────────────────
function AnimatedStat({ target, format, label, sub }) {
  const ref = useRef()
  const [val, setVal] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const startTime = performance.now()
        const duration = 1400
        const step = (now) => {
          const progress = Math.min((now - startTime) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setVal(target * eased)
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return (
    <div ref={ref}>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{format(val)}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
    </div>
  )
}

// ── Interactive AI engine demo ────────────────────────────────────────────────
function InteractiveDemo() {
  const ENGINES = [
    { name: 'ChatGPT',    score: 82, color: '#10a37f', bars: [90, 78, 65, 85, 72] },
    { name: 'Claude',     score: 91, color: '#5e6ad2', bars: [95, 88, 82, 90, 88] },
    { name: 'Perplexity', score: 74, color: '#4b9bdd', bars: [85, 70, 55, 72, 75] },
    { name: 'Gemini',     score: 68, color: '#d9a53a', bars: [75, 65, 50, 68, 62] },
    { name: 'Grok',       score: 55, color: '#e5484d', bars: [60, 52, 40, 58, 60] },
    { name: 'Llama',      score: 63, color: '#8b5cf6', bars: [70, 60, 45, 65, 70] },
  ]
  const DIMS = ['Content', 'Structure', 'Signals', 'Authority', 'Freshness']
  const [active, setActive] = useState(0)
  const paused = useRef(false)

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) setActive(a => (a + 1) % ENGINES.length)
    }, 2400)
    return () => clearInterval(t)
  }, [])

  const handleSelect = (i) => {
    paused.current = true
    setActive(i)
    setTimeout(() => { paused.current = false }, 9000)
  }

  const engine = ENGINES[active]

  return (
    <div style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Color accent bar */}
      <div style={{ height: 3, background: engine.color, transition: 'background 0.5s ease' }} />

      {/* Engine tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {ENGINES.map((e, i) => (
          <button key={e.name} onClick={() => handleSelect(i)} style={{
            flex: 1, padding: '8px 4px', background: 'none', border: 'none',
            borderBottom: `2px solid ${active === i ? e.color : 'transparent'}`,
            cursor: 'pointer', fontSize: 10, fontWeight: 600,
            color: active === i ? e.color : 'var(--muted)',
            transition: 'all 0.2s', whiteSpace: 'nowrap', minWidth: 0,
          }}>{e.name}</button>
        ))}
      </div>

      <div style={{ padding: '18px 22px' }}>
        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <ScoreRingLanding score={engine.score} size={64} accentColor={engine.color} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3 }}>
              {engine.name} readiness score
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: engine.color, letterSpacing: '-0.5px', lineHeight: 1, transition: 'color 0.4s ease' }}>
              {engine.score}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--subtle)' }}>/100</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>yourwebsite.com · example</div>
          </div>
        </div>

        {/* Dimension bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {DIMS.map((d, i) => (
            <div key={d}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                <span style={{ color: 'var(--subtle)' }}>{d}</span>
                <span style={{ color: engine.color, fontWeight: 700, transition: 'color 0.4s ease' }}>{engine.bars[i]}</span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3, background: engine.color, opacity: 0.85,
                  width: `${engine.bars[i]}%`,
                  transition: 'width 0.55s cubic-bezier(0.4,0,0.2,1), background 0.4s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot nav + label */}
      <div style={{ padding: '8px 22px 12px', display: 'flex', alignItems: 'center', gap: 5, borderTop: '1px solid var(--border)' }}>
        {ENGINES.map((e, i) => (
          <button key={e.name} onClick={() => handleSelect(i)} style={{
            width: active === i ? 16 : 6, height: 6, borderRadius: 3, border: 'none',
            cursor: 'pointer', padding: 0,
            background: active === i ? e.color : 'var(--border2)',
            transition: 'all 0.25s ease',
          }} />
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.4px', fontWeight: 600 }}>
          {paused.current ? 'PINNED' : 'AUTO-CYCLING'}
        </div>
      </div>
    </div>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "Why does AI visibility matter?", a: "AI search engines like ChatGPT and Perplexity now handle billions of queries. Traffic from AI converts 5x better than Google. If your site isn't readable by AI, you're missing this traffic." },
  { q: "Which AI systems does Galuli work with?", a: "Six: ChatGPT, Perplexity, Claude, Gemini, Grok, and Llama. Each reads websites differently. Galuli optimizes for all of them." },
  { q: "Is Galuli free?", a: "Yes. Scan any site for free, no account needed. The free plan includes scores, audits, and analytics. Paid plans start at $9/mo for continuous monitoring and Content Doctor." },
  { q: "How is this different from SEO tools?", a: "SEO tools help you rank in Google. Galuli helps you get cited in AI answers. You can rank #1 in Google and be completely invisible to ChatGPT." },
  { q: "Do I need to change my website code?", a: "No. Galuli works by adding one script tag to your site. Everything else is automatic — no backend changes, no code rewrites, no developer needed." },
]

function FaqAccordion() {
  const [open, setOpen] = useState(null)
  return (
    <div>
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: '100%', textAlign: 'left', padding: '14px 0', background: 'none',
                border: 'none', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', gap: 14,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{item.q}</span>
              <span style={{ fontSize: 16, color: 'var(--subtle)', flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>+</span>
            </button>
            {isOpen && (
              <div style={{ paddingBottom: 14, fontSize: 15, color: 'var(--subtle)', lineHeight: 1.7, animation: 'fadeSlideUp 0.15s ease forwards' }}>
                {item.a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export function LandingPage({ onScanComplete, onAuthRequired }) {
  const [url, setUrl] = useState('')
  const [stage, setStage] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef()

  // Bottom CTA beta signup
  const [betaEmail, setBetaEmail] = useState('')
  const [betaDone, setBetaDone] = useState(false)
  const [betaSubmitting, setBetaSubmitting] = useState(false)

  const handleBetaSignup = async (e) => {
    e.preventDefault()
    setBetaSubmitting(true)
    try {
      const name = betaEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Beta user'
      await fetch(`${API_BASE}/api/v1/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: betaEmail.trim(), plan: 'free', password: null }),
      })
    } catch (_) { /* fail silently */ }
    finally { setBetaDone(true); setBetaSubmitting(false) }
  }

  const STAGES = ['Crawling your pages…','Running AI analysis (4 passes)…','Extracting capabilities…','Calculating AI Readiness Score…','Almost done…']

  const handleScan = async (e) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    setStage('scanning'); setProgress(0); setError('')
    try {
      const job = await scanSite(fullUrl)
      const domain = job.domain
      const finishScan = async (domain) => {
        setProgress(95)
        const [score, registry] = await Promise.all([
          getScore(domain).catch(() => ({ total: 0, grade: 'F', label: 'Not scored yet', dimensions: {}, suggestions: [] })),
          getRegistry(domain).catch(() => ({ capabilities: [], metadata: {} })),
        ])
        setProgress(100); setStage('done')
        onScanComplete({ domain, score, registry })
      }
      if (job.status === 'complete') { await finishScan(domain); return }
      let stageIdx = 0, fakeProgress = 8
      const startedAt = Date.now()
      const TIMEOUT_MS = 90000 // 90 seconds max wait
      const interval = setInterval(async () => {
        try {
          // Timeout guard — surface a friendly error if crawl stalls
          if (Date.now() - startedAt > TIMEOUT_MS) {
            clearInterval(interval)
            setStage('error')
            setError('The scan is taking longer than expected. The site may be slow to respond — try again in a moment.')
            return
          }
          const updated = await pollJob(job.job_id)
          // Progress targets per stage — crawling reaches 35 fast (5-page scan is quick)
          const targetProgress = { crawling: 35, comprehending: 72, storing: 90 }[updated.status] || fakeProgress
          fakeProgress = Math.min(fakeProgress + 4, targetProgress)
          setProgress(Math.round(fakeProgress))
          const newStageIdx = { crawling: 0, comprehending: 1, storing: 3 }[updated.status] ?? stageIdx
          if (newStageIdx !== stageIdx) { stageIdx = newStageIdx }
          if (updated.status === 'complete') { clearInterval(interval); await finishScan(domain) }
          else if (updated.status === 'failed') { clearInterval(interval); throw new Error(updated.error || 'Scan failed') }
        } catch (err) { clearInterval(interval); setStage('error'); setError(err.message || 'Scan error') }
      }, 1200)
    } catch (err) { setStage('error'); setError(err.message || 'Scan failed') }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <LandingNav onSignIn={onAuthRequired} />

      {/* ── Hero ── */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="hero-grid" style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 64px 72px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,560px)', gap: 80, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <div className="hero-badge-row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <div className="badge badge-purple" style={{ fontSize: 11 }}>
                Private Beta
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>· Limited access · Every signup reviewed personally</div>
            </div>
            <h1 style={{ fontSize: 'clamp(42px, 5.5vw, 72px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 22, color: 'var(--text)' }}>
              AI can't cite you<br />
              <span style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>if it can't find you.</span>
            </h1>
            <p style={{ fontSize: 18, color: 'var(--subtle)', lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
              ChatGPT, Perplexity, and Claude recommend products every day. If your website isn't readable by AI, you're invisible in those answers. Galuli shows you why — and fixes it automatically.
            </p>

            {/* Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                { label: 'Free instant scan.', detail: 'See how AI reads your website right now — in 10 seconds.' },
                { label: 'Clear action items.', detail: 'Not vague advice. Specific things to fix, with how-to links.' },
                { label: 'One script tag.', detail: 'Install once. Galuli monitors and fixes things continuously.' },
              ].map(({ label, detail }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 800, fontSize: 10, flexShrink: 0, marginTop: 1 }}>✓</div>
                  <span><strong style={{ color: 'var(--text)', fontWeight: 600 }}>{label}</strong>{' '}<span style={{ color: 'var(--subtle)' }}>{detail}</span></span>
                </div>
              ))}
            </div>

            {/* Scan form */}
            {stage === 'idle' && (
              <form onSubmit={handleScan} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 480 }}>
                <input
                  ref={inputRef}
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="yourwebsite.com"
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button type="submit" className="btn btn-primary">Join the beta →</button>
              </form>
            )}
            {stage === 'error' && (
              <div>
                <div style={{ background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.3)', borderRadius: 6, padding: '10px 14px', color: 'var(--red)', marginBottom: 10, fontSize: 13 }}>{error}</div>
                <button onClick={() => setStage('idle')} className="btn btn-ghost btn-sm">Try again</button>
              </div>
            )}
            {stage === 'scanning' && (
              <div style={{ maxWidth: 480 }}>
                <ScanAnimation url={url} progress={progress} />
              </div>
            )}
            <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 10 }}>Free scan · No account needed · No credit card</p>
          </div>

          {/* Right — interactive AI engine demo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <InteractiveDemo />
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, textAlign: 'center' }}>
          <AnimatedStat target={14.2} format={v => `${v.toFixed(1)}%`}  label="AI visitors convert at 14.2%"   sub="vs 2.8% from Google" />
          <AnimatedStat target={63}   format={v => `${Math.round(v)}%`}  label="of buyers ask AI first" sub="before searching Google" />
          <AnimatedStat target={35}   format={v => `+${Math.round(v)}%`} label="more AI mentions"   sub="with proper optimization" />
          <AnimatedStat target={76.4} format={v => `${v.toFixed(1)}%`}  label="of cited pages"            sub="updated in the last 30 days" />
        </div>
      </div>

      {/* ── Trust strip ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '14px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Visible to</span>
          {['ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Grok', 'Llama', 'WebMCP Agents'].map(name => (
            <span key={name} style={{ fontSize: 13, color: 'var(--subtle)', fontWeight: 500 }}>{name}</span>
          ))}
        </div>
      </div>

      {/* ── Third-party proof ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '18px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 3, height: 32, background: 'var(--accent)', borderRadius: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: 'var(--text)', fontWeight: 600 }}>Reuters (1.5M searches/mo) outranks Fox News (42M) in AI citations.</strong>
            {' '}Brand scale doesn't predict AI visibility — structure and authority do.
          </p>
          <a href="https://www.similarweb.com/corp/2026-genai-brand-visibility-index/" target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
            SimilarWeb 2026 GenAI Index ↗
          </a>
        </div>
      </div>

      {/* ── Contrast section ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '48px 32px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="eyebrow">Why Galuli is different</div>
            <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>Most tools track AI visibility.<br />Galuli fixes it.</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 12 }}>Other tools tell you where you rank. Galuli finds what's broken and fixes it automatically.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 0, alignItems: 'start' }}>
            <div style={{ paddingRight: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>Other GEO tools</div>
              {[
                'Track your AI ranking',
                'Suggest improvements',
                'Leave you to implement',
                'Report what\'s broken',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13, flexShrink: 0 }}>✗</span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--border)', alignSelf: 'stretch' }} />
            <div style={{ paddingLeft: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>Galuli</div>
              {[
                'Check if AI can actually read your site',
                'Auto-generate the files AI needs',
                'Fix blocking issues automatically',
                'Monitor 24/7 and alert on problems',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ color: 'var(--green)', fontSize: 13, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow">How it works</div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>From invisible to cited in three steps</h2>
          <p style={{ fontSize: 16, color: 'var(--subtle)' }}>One script tag. Galuli handles everything else.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 1, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--border)' }}>
          {[
            { step: '01', title: 'Scan your website', desc: 'Enter any URL. In 10 seconds, see exactly what AI systems see when they look at your website. No signup needed.' },
            { step: '02', title: 'See what to fix', desc: 'Each issue comes with a clear status — pass, fail, or warning — and a direct fix. Not vague advice. Specific actions you can take right now.', tag: 'Results in ~10 seconds' },
            { step: '03', title: 'Install and relax', desc: 'Paste one line of code. Galuli monitors your site, alerts you if something breaks, and keeps AI systems up to date automatically.', tag: '30 seconds to install' },
          ].map(({ step, title, desc, tag }) => (
            <div key={step} className="step-card" style={{ background: 'var(--surface)', padding: '24px 24px 20px', position: 'relative', transition: 'background 0.2s ease' }}>
              {tag && <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, background: 'rgba(94,106,210,0.1)', border: '1px solid rgba(94,106,210,0.25)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 3, fontWeight: 600 }}>{tag}</div>}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Step {step}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text)', letterSpacing: '-0.2px' }}>{title}</div>
              <p style={{ fontSize: 15, color: 'var(--subtle)', lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Real-time AI browsing ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 56, alignItems: 'center' }}>
            <div>
              <div className="eyebrow">The invisible website problem</div>
              <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 16, lineHeight: 1.1 }}>
                Most websites are invisible to AI.
              </h2>
              <p style={{ color: 'var(--subtle)', fontSize: 16, lineHeight: 1.8, marginBottom: 14 }}>
                Modern websites use JavaScript to show content. The problem: AI systems like ChatGPT and Perplexity <strong style={{ color: 'var(--text)', fontWeight: 600 }}>can't run JavaScript</strong> — so they visit your site and see a blank page.
              </p>
              <p style={{ color: 'var(--subtle)', fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
                Galuli captures what your real visitors see and serves it to AI in a format they can read. No code changes needed.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { who: 'Human visitor',       icon: '👤', reads: 'Your website loads normally in their browser.', result: '✓ Sees everything',  ok: true  },
                { who: 'AI without Galuli',   icon: '🤖', reads: 'Visits your site — sees a blank page.',  result: '✗ Sees nothing',   ok: false },
                { who: 'AI with Galuli',      icon: '⬡',  reads: 'Gets a complete, readable version of your site.', result: '✓ Fully readable', ok: true  },
              ].map(({ who, icon, reads, result, ok }, i) => (
                <div key={who} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 12, alignItems: 'center', padding: '16px 18px', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', background: ok ? 'var(--surface)' : 'rgba(229,72,77,0.04)' }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{who}</div>
                    <div style={{ fontSize: 12, color: 'var(--subtle)' }}>{reads}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: ok ? 'var(--green)' : 'var(--red)', whiteSpace: 'nowrap' }}>{result}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <div className="eyebrow">What's included</div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>Everything AI needs<br />to read your site.</h2>
            <p style={{ fontSize: 16, color: 'var(--subtle)' }}>One script tag. Every feature activates automatically — no config, no backend changes.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--border)' }}>
            {[
              { title: 'AI Readiness Score',               desc: 'A 0–100 score showing how well AI systems can read your website. See exactly where you\'re strong and what needs fixing.', color: 'var(--accent)' },
              { title: 'Auto-generated AI files',          desc: 'Galuli creates the files AI systems look for on your website. Without these, AI has to guess what you do — and usually gets it wrong.', color: 'var(--green)' },
              { title: 'Crawler access check',             desc: 'Some websites accidentally block AI systems. Galuli checks if you\'re blocking ChatGPT, Claude, or Perplexity — and shows you how to fix it in 2 minutes.', color: 'var(--yellow)' },
              { title: 'Content Doctor',                   desc: 'Finds content that AI systems won\'t trust or won\'t cite. Gets you specific rewrites — not generic advice.', color: 'var(--blue)' },
              { title: 'AI traffic dashboard',             desc: 'See which AI systems visit your site, which pages they read, and how that changes over time. This traffic is invisible to Google Analytics.', color: 'var(--red)' },
              { title: 'Automatic updates',                desc: 'When you update your website, Galuli detects the change and re-indexes automatically. AI systems always see your latest content.', color: 'var(--purple)' },
            ].map(({ title, desc, color }) => (
              <div key={title} className="feature-card" style={{ background: 'var(--surface)', padding: '20px 22px', transition: 'background 0.2s ease, box-shadow 0.2s ease' }}>
                <div style={{ width: 3, height: 16, background: color, borderRadius: 2, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>{title}</div>
                <div style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Score scale ── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <div className="eyebrow">AI Readiness Score</div>
            <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>How readable is your website to AI?</h2>
            <p style={{ fontSize: 16, color: 'var(--subtle)' }}>A simple 0–100 score. The higher you score, the more likely AI systems are to recommend you.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {[
              { range: '90–100', grade: 'A+', color: 'var(--green)',  pct: 100, label: 'Fully AI-readable',      desc: 'AI systems can read and cite your site with confidence.' },
              { range: '70–89',  grade: 'B',  color: 'var(--blue)',   pct: 80,  label: 'Mostly readable',          desc: 'AI understands you well. A few gaps keep you from full coverage.' },
              { range: '50–69',  grade: 'C',  color: 'var(--yellow)', pct: 60,  label: 'Partially readable',       desc: 'AI can find you but misses important details. Common for sites that haven\'t optimized.' },
              { range: '30–49',  grade: 'D',  color: 'var(--red)',    pct: 40,  label: 'Hard to read',             desc: 'AI struggles to understand your site. You\'re likely being skipped.' },
              { range: '0–29',   grade: 'F',  color: 'var(--subtle)', pct: 20,  label: 'Invisible to AI',          desc: 'AI systems can\'t read your site at all. One script tag changes everything.' },
            ].map(({ range, grade, color, pct, label, desc }, i) => (
              <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', background: 'var(--surface)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: color === 'var(--muted)' ? 'var(--surface2)' : `${color}15`, border: `1px solid ${color === 'var(--muted)' ? 'var(--border)' : `${color}30`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color, fontSize: 13, flexShrink: 0 }}>{grade}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{label}</span>
                    <span style={{ fontSize: 12, color: 'var(--subtle)', flexShrink: 0, marginLeft: 10 }}>{range}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 3, height: 3, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtle)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <div className="eyebrow">FAQ</div>
          <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>Questions we get asked a lot</h2>
        </div>
        <FaqAccordion />
      </div>

      {/* ── For agencies ── */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <div className="eyebrow">For agencies</div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>Sell AI visibility.<br />Not just rankings.</h2>
            <p style={{ fontSize: 16, color: 'var(--subtle)', maxWidth: 560 }}>Your clients are asking about AI search. Galuli gives you a concrete, measurable answer — with reports they can understand and scores that update automatically.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--border)', marginBottom: 24 }}>
            {[
              { color: 'var(--accent)',  title: 'Client-ready score reports', desc: 'Every scanned domain gets a score report with a grade and specific action items. Screenshot it. Send it. Bill for it.' },
              { color: 'var(--green)',   title: 'Monitor all your clients at once', desc: "The Agency plan covers unlimited domains. See every client's AI score in one dashboard. Get alerted when scores drop or crawlers get blocked." },
              { color: 'var(--purple)',  title: 'Embeddable score badge', desc: "Give clients a live score badge for their site. It updates automatically and links to their full report — a tangible proof point for your retainer." },
            ].map(({ color, title, desc }) => (
              <div key={title} className="feature-card" style={{ background: 'var(--surface)', padding: '20px 22px', transition: 'background 0.2s ease' }}>
                <div style={{ width: 3, height: 16, background: color, borderRadius: 2, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>{title}</div>
                <div style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="/pricing" className="btn btn-primary">See Agency pricing →</a>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Unlimited domains · $799/yr · White-glove onboarding</span>
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <GaluMascot size={72} mood="default" style={{ marginBottom: 20, display: 'inline-block' }} />
          <div className="badge badge-purple" style={{ fontSize: 11, marginBottom: 16, display: 'inline-block' }}>Private Beta</div>
          <h2 style={{ fontSize: 'clamp(30px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12, color: 'var(--text)', lineHeight: 1.1 }}>Ready to join?</h2>
          <p style={{ fontSize: 17, color: 'var(--subtle)', marginBottom: 28 }}>Drop your email. Free forever, no credit card. You'll get personal onboarding — not a drip campaign.</p>
          {betaDone ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', background: 'rgba(74,173,82,0.08)', border: '1px solid rgba(74,173,82,0.25)', borderRadius: 8, fontSize: 14, color: 'var(--green)', fontWeight: 600 }}>
              <span style={{ fontSize: 18 }}>✓</span> You're on the list — we'll be in touch soon.
            </div>
          ) : (
            <form onSubmit={handleBetaSignup} style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <input type="email" required value={betaEmail} onChange={e => setBetaEmail(e.target.value)} placeholder="you@company.com" style={{ flex: 1, minWidth: 200, maxWidth: 300 }} />
              <button type="submit" className="btn btn-primary" disabled={betaSubmitting}>
                {betaSubmitting ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Joining…</> : 'Join the beta →'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
          <div style={{ width: 18, height: 18, background: 'var(--accent)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 800 }}>g</div>
          galuli
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {[['Pricing', '/pricing'], ['Blog', '/blog'], ['About', '/about'], ['Roadmap', '/roadmap'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'none' }}>{label}</a>
          ))}
          <a href="mailto:hello@galuli.io" style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'none' }}>hello@galuli.io</a>
          <span style={{ fontSize: 12, color: 'var(--subtle)' }}>© 2026 Galuli</span>
        </div>
        <a href="/dashboard/" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Dashboard →</a>
      </div>

      <style>{`
        /* ── Mobile layout ── */
        @media (max-width: 800px) {
          .landing-nav { padding: 0 16px !important; }
          .nav-links-desktop { display: none !important; }

          .hero-grid {
            grid-template-columns: 1fr !important;
            padding: 40px 20px 36px !important;
            gap: 36px !important;
          }
          .hero-badge-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          .two-col-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 600px) {
          .hero-grid h1 {
            font-size: 32px !important;
            letter-spacing: -0.02em !important;
          }
          .hero-grid p {
            font-size: 16px !important;
          }
        }

        /* ── Hover effects (desktop only) ── */
        @media (hover: hover) {
          .feature-card:hover {
            background: var(--surface2) !important;
            box-shadow: inset 0 0 0 1px var(--border2);
          }
          .step-card:hover {
            background: var(--surface2) !important;
          }
        }
      `}</style>
    </div>
  )
}

// ── Results Page ──────────────────────────────────────────────────────────────
export function ResultsPage({ data, onRegistered }) {
  const { domain, score: rawScore } = data
  const score = { total: 0, grade: 'F', label: 'Poor AI Visibility', dimensions: {}, suggestions: [], ...rawScore }

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emailDone, setEmailDone] = useState(() => !!localStorage.getItem('galuli_user'))
  const [copied, setCopied] = useState(false)

  const gradeColor = score.total >= 70 ? 'var(--green)' : score.total >= 50 ? 'var(--yellow)' : 'var(--red)'
  const badgeUrl = `${API_BASE}/api/v1/score/${domain}/badge`
  const badgeCode = `<a href="https://galuli.io" title="AI Readiness Score">\n  <img src="${badgeUrl}" alt="Galuli AI Readiness Score" />\n</a>`

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Derive a name from the email (e.g. "jane" from "jane@company.com")
      const derivedName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Beta user'
      const res = await fetch(`${API_BASE}/api/v1/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: derivedName, email: email.trim(), plan: 'free', password: null }),
      })
      const data = await res.json()
      // Accept both success and "already exists" as OK — user is in the system either way
      if (res.ok) {
        localStorage.setItem('galuli_api_key', data.api_key)
        localStorage.setItem('galuli_email', data.email)
        localStorage.setItem('galuli_name', data.name)
        localStorage.setItem('galuli_plan', data.plan || 'free')
      }
    } catch (_) {
      // Fail silently — still show the thank-you (email was captured if the request went through)
    } finally {
      localStorage.setItem('galuli_user', JSON.stringify({ email, registered_at: new Date().toISOString() }))
      setEmailDone(true)
      setSubmitting(false)
    }
  }

  const DIM_COLORS = {
    'Content Coverage': 'var(--accent)',
    'Structure Quality': 'var(--blue)',
    'Machine Signals': 'var(--purple)',
    'Authority': 'var(--green)',
    'Freshness': 'var(--yellow)',
  }
  const fallbackDims = {
    'Content Coverage': { score: 0, max: 25 },
    'Structure Quality': { score: 0, max: 20 },
    'Machine Signals':   { score: 0, max: 20 },
    'Authority':         { score: 0, max: 20 },
    'Freshness':         { score: 0, max: 15 },
  }
  const dims = Object.keys(score.dimensions || {}).length > 0 ? score.dimensions : fallbackDims

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav */}
      <nav style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, color: 'var(--text)', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
          <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 800 }}>g</div>
          galuli
        </div>
        <div style={{ fontSize: 13, color: 'var(--subtle)' }}>
          AI Readiness Report · <strong style={{ color: 'var(--text)' }}>{domain}</strong>
        </div>
        <button onClick={() => onRegistered && onRegistered()} className="btn btn-primary btn-sm">Open Dashboard →</button>
      </nav>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Score hero */}
        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', borderColor: `${gradeColor}30` }}>
          <ScoreRingLanding score={score.total} size={100} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>AI Readiness Score</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.3px' }}>{score.label}</div>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 10 }}>{domain}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-blue">Score: {score.total}/100</span>
              <span className="badge" style={{ color: gradeColor, border: `1px solid ${gradeColor}40`, background: `${gradeColor}12` }}>Grade: {score.grade}</span>
              {score.total >= 70 && <span className="badge badge-green">✓ AI-Ready</span>}
              {score.total < 40 && <span className="badge badge-yellow">⚠ Needs Work</span>}
            </div>
            <p style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.6, marginTop: 10 }}>
              {score.total >= 85
                ? "You're fully AI-readable. AI systems can cite you with confidence."
                : score.total >= 70
                ? "Most AI systems understand you well. You're appearing in AI answers — let's close the remaining gaps."
                : score.total >= 55
                ? "AI can reach you but often gets an incomplete picture. You're appearing in some answers but missing citation opportunities."
                : score.total >= 40
                ? "AI systems struggle to understand your site. You're likely being skipped in AI-generated answers."
                : "AI systems cannot reliably understand your site. You're invisible in AI-generated answers right now."}
            </p>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16 }}>Score breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(dims).map(([key, dim]) => {
              const pct = dim.max > 0 ? (dim.score / dim.max) * 100 : 0
              const color = DIM_COLORS[key] || 'var(--accent)'
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 500 }}>{key}</span>
                    <span style={{ color: 'var(--subtle)' }}>{dim.score}/{dim.max}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 3, height: 4 }}>
                    <div style={{ height: 4, borderRadius: 3, background: color, width: `${pct}%`, transition: 'width 1s ease 0.3s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Suggestions */}
        {score.suggestions?.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Top improvements</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {score.suggestions.map((tip, i) => {
                const text = typeof tip === 'string' ? tip : (tip?.issue || tip?.fix || '')
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{i + 1}</div>
                    <div style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.6, paddingTop: 1 }}>{text}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* What gets better */}
        {score.total < 85 && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(94,106,210,0.06)', border: '1px solid rgba(94,106,210,0.2)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1, color: 'var(--accent)' }}>↑</span>
            <p style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6, margin: 0 }}>
              Fix the issues above and your score could reach{' '}
              <strong style={{ color: 'var(--accent)' }}>
                Grade {score.total >= 70 ? 'A (85+)' : score.total >= 55 ? 'B (70+)' : score.total >= 40 ? 'C (55+)' : 'D (40+)'}
              </strong>
              {' '}— putting you in the range where AI systems actively cite sites like yours.
            </p>
          </div>
        )}

        {/* Locked features */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>What Starter unlocks</div>
            <span className="badge badge-purple">from $9/mo</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { title: 'AI Attention Score', desc: 'See how much attention each AI system pays to your site.', locked: true },
              { title: 'Content Doctor', desc: 'Find claims AI won\'t trust with specific rewrites.', locked: true },
              { title: 'Continuous Monitoring', desc: 'Every page change triggers an automatic rescan.', locked: true },
              { title: 'Embeddable Badge', desc: 'Show visitors you\'re AI-ready. Always live, always accurate.', locked: !emailDone },
            ].map(({ title, desc, locked }) => (
              <div key={title} style={{ position: 'relative', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', padding: '14px', overflow: 'hidden' }}>
                {locked && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,14,16,0.85)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, zIndex: 2 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, marginBottom: 3 }}>🔒</div>
                      <div style={{ fontSize: 10, color: 'var(--subtle)', fontWeight: 600 }}>Starter plan</div>
                    </div>
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, color: 'var(--text)' }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {!emailDone ? (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(94,106,210,0.25)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.2px' }}>Join the beta</div>
              <div className="badge badge-purple" style={{ fontSize: 10 }}>Private Beta</div>
            </div>
            <p style={{ color: 'var(--subtle)', fontSize: 12, lineHeight: 1.7, marginBottom: 16, maxWidth: 440 }}>
              Drop your email to join the beta. Free, no credit card. You'll get a personal onboarding — not an automated drip.
            </p>
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required style={{ flex: 1, minWidth: 200 }} />
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Joining…</> : 'Join the beta →'}
              </button>
            </form>
            <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 10 }}>Free · No credit card · Personal onboarding</p>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(74,173,82,0.25)' }}>
            <GaluMascot size={56} mood="celebrate" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, letterSpacing: '-0.2px' }}>You're on the list!</div>
            <p style={{ color: 'var(--subtle)', fontSize: 13, lineHeight: 1.7, marginBottom: 14, maxWidth: 420 }}>
              We'll reach out to you at <strong style={{ color: 'var(--text)' }}>{email}</strong> personally — usually within a day.
              In the meantime, your dashboard is ready to explore.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => onRegistered && onRegistered()} className="btn btn-primary">Open Dashboard →</button>
            </div>
          </div>
        )}

        {/* Badge */}
        <div className="card" style={{ marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          {!emailDone && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,14,16,0.88)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, borderRadius: 'inherit' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>🔒</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>Embeddable Score Badge</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Create a free account to unlock</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Embed your score badge</div>
              <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 12, maxWidth: 340 }}>Show visitors your site is AI-ready. Updates automatically.</p>
              <img src={badgeUrl} alt="AI Readiness Score badge" style={{ display: 'block', marginBottom: 12, borderRadius: 6 }} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="label">HTML snippet</div>
              <pre style={{ marginBottom: 8, fontSize: 11 }}>{badgeCode}</pre>
              <button onClick={() => { navigator.clipboard.writeText(badgeCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }} className="btn btn-ghost btn-sm">
                {copied ? '✓ Copied' : 'Copy snippet'}
              </button>
            </div>
          </div>
        </div>

        {/* Install snippet */}
        {emailDone && (
          <div className="card" style={{ borderColor: 'rgba(94,106,210,0.25)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Start monitoring {domain}</div>
            <p style={{ color: 'var(--subtle)', fontSize: 12, marginBottom: 14 }}>Paste this in your site's &lt;head&gt;. Galuli generates your llms.txt, registers WebMCP, and tracks AI agent visits.</p>
            <div className="code-block" style={{ marginBottom: 12 }}>
              {`<script src="${API_BASE}/galuli.js" defer></script>`}
            </div>
            <button onClick={() => onRegistered && onRegistered()} className="btn btn-primary">Go to Dashboard →</button>
          </div>
        )}
      </div>
    </div>
  )
}
