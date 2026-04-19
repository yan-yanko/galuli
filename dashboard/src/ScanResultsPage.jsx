import { useState, useEffect } from 'react'
import { ScoreRingLanding } from './Landing.jsx'
import { GaluMascot } from './Galu.jsx'

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : window.location.origin

// ── Score Ring (small, for engine cards) ─────────────────────────────────────
function MiniRing({ score, max = 20, size = 44, color }) {
  const pct = max > 0 ? score / max : 0
  const r = size / 2 - 4
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    good:      { label: 'Good',       bg: 'rgba(74,173,82,0.1)',  border: 'rgba(74,173,82,0.3)',  color: 'var(--green)' },
    needs_work:{ label: 'Needs Work', bg: 'rgba(217,165,58,0.1)', border: 'rgba(217,165,58,0.3)', color: 'var(--yellow)' },
    missing:   { label: 'Low',        bg: 'rgba(229,72,77,0.1)',  border: 'rgba(229,72,77,0.3)',  color: 'var(--red)' },
  }[status] || { label: status, bg: 'var(--surface2)', border: 'var(--border)', color: 'var(--subtle)' }
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ── GEO Engine Card ──────────────────────────────────────────────────────────
function GeoEngineCard({ engine }) {
  return (
    <div style={{ background: 'var(--surface)', padding: 16, borderTop: `3px solid ${engine.color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <MiniRing score={engine.score} max={engine.max} color={engine.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{engine.llm}</div>
          <StatusBadge status={engine.status} />
        </div>
      </div>
      {engine.recommendations?.[0] && (
        <div style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
          {engine.recommendations[0]}
        </div>
      )}
    </div>
  )
}

// ── GEO Engine Grid ──────────────────────────────────────────────────────────
function GeoEngineGrid({ geo }) {
  const engines = geo?.llms ? Object.values(geo.llms) : []
  if (engines.length === 0) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>AI Engine Readiness</div>
        {geo.geo_grade && (
          <span className="badge badge-blue" style={{ fontSize: 10 }}>GEO Score: {geo.geo_total}/100 ({geo.geo_grade})</span>
        )}
      </div>
      <div className="geo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {engines.map(e => <GeoEngineCard key={e.llm} engine={e} />)}
      </div>
    </div>
  )
}

// ── Entity Snapshot ──────────────────────────────────────────────────────────
function EntitySnapshot({ registry }) {
  if (!registry?.metadata) return null
  const m = registry.metadata || {}
  const ai = registry.ai_metadata || {}
  const caps = registry.capabilities || []
  const capNames = caps.slice(0, 3).map(c => typeof c === 'string' ? c : c?.name || c?.capability_name || 'Unnamed')

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>What AI Understands About You</div>
      <div className="entity-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: identity */}
        <div>
          {m.name && <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{m.name}</div>}
          {m.category && m.category !== 'unknown' && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              <span className="badge badge-purple" style={{ fontSize: 10 }}>{m.category}</span>
              {(m.sub_categories || []).slice(0, 3).map(s => (
                <span key={s} className="badge" style={{ fontSize: 10, border: '1px solid var(--border)', color: 'var(--subtle)' }}>{s}</span>
              ))}
            </div>
          )}
          {m.description && (
            <div style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {m.description}
            </div>
          )}
          {capNames.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--subtle)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{caps.length} capabilities</span> found
              {capNames.length > 0 && ` — ${capNames.join(', ')}${caps.length > 3 ? '...' : ''}`}
            </div>
          )}
        </div>
        {/* Right: AI stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {ai.pages_crawled >= 5 ? '~' : '!'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{ai.pages_crawled || 0} pages analyzed</div>
              <div style={{ fontSize: 10, color: 'var(--subtle)' }}>{ai.source === 'push' ? 'Live monitoring active' : 'One-time scan'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {(ai.confidence_score || 0) >= 0.7 ? '+' : '-'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                {Math.round((ai.confidence_score || 0) * 100)}% AI comprehension
              </div>
              <div style={{ fontSize: 10, color: 'var(--subtle)' }}>
                {(ai.confidence_score || 0) >= 0.7 ? 'AI understands your content well' : 'Content clarity could improve'}
              </div>
            </div>
          </div>
          {ai.robots_blocks_ai_crawlers && (
            <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, padding: '6px 10px', background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.2)', borderRadius: 6 }}>
              robots.txt is blocking AI crawlers
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Score Breakdown ──────────────────────────────────────────────────────────
const DIM_COLORS = {
  'Entity Establishment': 'var(--accent)',
  'Content Retrieval': '#3b82f6',
  'Freshness': '#d9a53a',
}

function ScoreBreakdown({ score }) {
  const dims = score?.dimensions || {}
  if (Object.keys(dims).length === 0) return null
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16 }}>Score Breakdown</div>
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
              {dim.description && (
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>{dim.description}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Top Fixes ────────────────────────────────────────────────────────────────
function TopFixes({ score, geo }) {
  const geoRecs = geo?.top_recommendations || []
  const suggestions = score?.suggestions || []
  if (geoRecs.length === 0 && suggestions.length === 0) return null

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Top Fixes</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* GEO per-engine recs first */}
        {geoRecs.map((rec, i) => (
          <div key={`geo-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(94,106,210,0.1)', border: '1px solid rgba(94,106,210,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{i + 1}</div>
            <div style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.6, paddingTop: 1 }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>For {rec.llm}:</span> {rec.action}
            </div>
          </div>
        ))}
        {/* Score-level suggestions */}
        {suggestions.map((tip, i) => {
          const text = typeof tip === 'string' ? tip : (tip?.issue || tip?.fix || '')
          return (
            <div key={`tip-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--subtle)' }}>{geoRecs.length + i + 1}</div>
              <div style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.6, paddingTop: 1 }}>{text}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton({ domain }) {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 14, color: 'var(--subtle)' }}>Loading AI readiness report for <strong style={{ color: 'var(--text)' }}>{domain}</strong></div>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="card" style={{ marginBottom: 16 }}>
          <div style={{ height: 20, background: 'var(--surface2)', borderRadius: 4, width: '40%', marginBottom: 12 }} />
          <div style={{ height: 12, background: 'var(--surface2)', borderRadius: 4, width: '80%', marginBottom: 8 }} />
          <div style={{ height: 12, background: 'var(--surface2)', borderRadius: 4, width: '60%' }} />
        </div>
      ))}
    </div>
  )
}

// ── Not Found ────────────────────────────────────────────────────────────────
function NotFound({ domain }) {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>?</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No data for {domain}</h2>
      <p style={{ fontSize: 14, color: 'var(--subtle)', marginBottom: 24 }}>This domain hasn't been scanned yet. Run a free scan to generate a report.</p>
      <a href="/" className="btn btn-primary">Scan this site</a>
    </div>
  )
}

// ── Main Results Page ────────────────────────────────────────────────────────
export default function ScanResultsPage({ domain, onRegistered, onNavigate }) {
  const [score, setScore] = useState(null)
  const [geo, setGeo] = useState(null)
  const [registry, setRegistry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Email capture
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emailDone, setEmailDone] = useState(() => !!localStorage.getItem('galuli_user'))
  const [copied, setCopied] = useState(false)
  const [shareUrlCopied, setShareUrlCopied] = useState(false)

  useEffect(() => {
    if (!domain) return
    setLoading(true)
    setNotFound(false)
    Promise.all([
      fetch(`${API_BASE}/api/v1/score/${domain}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/v1/geo/${domain}`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE}/registry/${domain}`).then(r => r.ok ? r.json() : null),
    ]).then(([s, g, r]) => {
      if (!s) { setNotFound(true); setLoading(false); return }
      setScore(s)
      setGeo(g)
      setRegistry(r)
      setLoading(false)
    }).catch(() => { setNotFound(true); setLoading(false) })
  }, [domain])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const derivedName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Beta user'
      const res = await fetch(`${API_BASE}/api/v1/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: derivedName, email: email.trim(), plan: 'free', password: null }),
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('galuli_api_key', data.api_key)
        localStorage.setItem('galuli_email', data.email)
        localStorage.setItem('galuli_name', data.name)
        localStorage.setItem('galuli_plan', data.plan || 'free')
      }
    } catch (_) {}
    finally {
      localStorage.setItem('galuli_user', JSON.stringify({ email, registered_at: new Date().toISOString() }))
      setEmailDone(true)
      setSubmitting(false)
    }
  }

  const shareUrl = `${window.location.origin}/scan/${domain}`
  const handleShare = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShareUrlCopied(true)
      setTimeout(() => setShareUrlCopied(false), 2000)
    })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <ResultsNav domain={domain} onNavigate={onNavigate} />
      <LoadingSkeleton domain={domain} />
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <ResultsNav domain={domain} onNavigate={onNavigate} />
      <NotFound domain={domain} />
    </div>
  )

  const gradeColor = score.total >= 70 ? 'var(--green)' : score.total >= 50 ? 'var(--yellow)' : 'var(--red)'
  const badgeUrl = `${API_BASE}/api/v1/score/${domain}/badge`
  const badgeCode = `<a href="https://galuli.io/?ref=${domain}&utm_source=badge&utm_medium=embed&utm_campaign=score_badge" target="_blank" title="AI Readiness Score">\n  <img src="${badgeUrl}" alt="Galuli AI Readiness Score" />\n</a>`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <ResultsNav domain={domain} onNavigate={onNavigate} onRegistered={onRegistered} />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* ── Score Hero ── */}
        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', borderColor: `${gradeColor}30` }}>
          <ScoreRingLanding score={score.total} size={100} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} width={20} height={20} style={{ borderRadius: 4 }} alt="" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{domain}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>AI Readiness Score</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.3px' }}>{score.label}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <span className="badge badge-blue">Score: {score.total}/100</span>
              <span className="badge" style={{ color: gradeColor, border: `1px solid ${gradeColor}40`, background: `${gradeColor}12` }}>Grade: {score.grade}</span>
              {score.total >= 70 && <span className="badge badge-green">AI-Ready</span>}
              {score.total < 40 && <span className="badge badge-yellow">Needs Work</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={handleShare} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                {shareUrlCopied ? 'Copied!' : 'Share report'}
              </button>
            </div>
          </div>
        </div>

        {/* ── AI Engine Grid ── */}
        <GeoEngineGrid geo={geo} />

        {/* ── Entity Snapshot ── */}
        <EntitySnapshot registry={registry} />

        {/* ── Score Breakdown ── */}
        <ScoreBreakdown score={score} />

        {/* ── Top Fixes ── */}
        <TopFixes score={score} geo={geo} />

        {/* ── What gets better ── */}
        {score.total < 85 && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(94,106,210,0.06)', border: '1px solid rgba(94,106,210,0.2)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1, color: 'var(--accent)' }}>^</span>
            <p style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6, margin: 0 }}>
              Fix the issues above and your score could reach{' '}
              <strong style={{ color: 'var(--accent)' }}>
                Grade {score.total >= 70 ? 'A (85+)' : score.total >= 55 ? 'B (70+)' : score.total >= 40 ? 'C (55+)' : 'D (40+)'}
              </strong>
              {' '} — putting you in the range where AI systems actively cite sites like yours.
            </p>
          </div>
        )}

        {/* ── Locked Features ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Unlock More</div>
            <span className="badge badge-purple">from $29/mo</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { title: 'Content Doctor', desc: 'Find claims AI won\'t trust with specific rewrites.', plan: 'Starter' },
              { title: 'Continuous Monitoring', desc: 'Every page change triggers an automatic rescan.', plan: 'Starter' },
              { title: 'Citation Tracker', desc: 'See when and where AI systems cite your content.', plan: 'Pro' },
              { title: 'AI Traffic Analytics', desc: 'Track which AI agents visit your site and what they read.', plan: 'Starter' },
            ].map(({ title, desc, plan }) => (
              <div key={title} style={{ position: 'relative', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', padding: 14, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,14,16,0.85)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, zIndex: 2 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, marginBottom: 3 }}>*</div>
                    <div style={{ fontSize: 10, color: 'var(--subtle)', fontWeight: 600 }}>{plan} plan</div>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, color: 'var(--text)' }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        {!emailDone ? (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(94,106,210,0.25)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.2px' }}>Get your full dashboard</div>
              <div className="badge badge-purple" style={{ fontSize: 10 }}>Free</div>
            </div>
            <p style={{ color: 'var(--subtle)', fontSize: 12, lineHeight: 1.7, marginBottom: 16, maxWidth: 440 }}>
              Create a free account for continuous monitoring, Content Doctor, embeddable badge, and more.
            </p>
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required style={{ flex: 1, minWidth: 200 }} />
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Creating...</> : 'Create free account'}
              </button>
            </form>
            <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 10 }}>Free forever plan. No credit card required.</p>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(74,173,82,0.25)' }}>
            <GaluMascot size={56} mood="celebrate" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, letterSpacing: '-0.2px' }}>Your dashboard is ready!</div>
            <p style={{ color: 'var(--subtle)', fontSize: 13, lineHeight: 1.7, marginBottom: 14, maxWidth: 420 }}>
              Explore your full AI readiness dashboard with monitoring, Content Doctor, and more.
            </p>
            <button onClick={() => onRegistered && onRegistered()} className="btn btn-primary">Open Dashboard</button>
          </div>
        )}

        {/* ── Badge ── */}
        <div className="card" style={{ marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          {!emailDone && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,14,16,0.88)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, borderRadius: 'inherit' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>*</div>
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
                {copied ? 'Copied!' : 'Copy snippet'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Install snippet ── */}
        {emailDone && (
          <div className="card" style={{ borderColor: 'rgba(94,106,210,0.25)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Start monitoring {domain}</div>
            <p style={{ color: 'var(--subtle)', fontSize: 12, marginBottom: 14 }}>Paste this in your site's &lt;head&gt;. Galuli monitors AI agent visits and keeps your registry up to date.</p>
            <div className="code-block" style={{ marginBottom: 12 }}>
              {`<script src="${API_BASE}/galuli.js" defer></script>`}
            </div>
            <button onClick={() => onRegistered && onRegistered()} className="btn btn-primary">Go to Dashboard</button>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 600px) {
          .geo-grid { grid-template-columns: 1fr !important; }
          .entity-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ── Results Nav ──────────────────────────────────────────────────────────────
function ResultsNav({ domain, onNavigate, onRegistered }) {
  return (
    <nav style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}>
        <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 800 }}>g</div>
        galuli
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--subtle)' }}>
          AI Readiness Report · <strong style={{ color: 'var(--text)' }}>{domain}</strong>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <a href="/leaderboard" className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--subtle)' }}>Leaderboard</a>
        <a href="/dashboard/" className="btn btn-primary btn-sm">Dashboard</a>
      </div>
    </nav>
  )
}
