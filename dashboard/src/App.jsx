import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import './index.css'
import './App.css'

// ── Toast ──────────────────────────────────────────────────────────────────
let _addToast = () => { }
function ToastContainer() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    _addToast = (msg, type = 'info') => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
    }
  }, [])
  return (
    <div className="toast-container">
      {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
    </div>
  )
}
const toast = {
  success: m => _addToast(m, 'success'),
  error: m => _addToast(m, 'error'),
  info: m => _addToast(m, 'info'),
}

// ── Shared components ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    operational: ['badge-green', 'Operational'],
    complete: ['badge-green', 'Complete'],
    degraded: ['badge-yellow', 'Degraded'],
    outage: ['badge-red', 'Outage'],
    unreachable: ['badge-red', 'Unreachable'],
    failed: ['badge-red', 'Failed'],
    crawling: ['badge-blue', 'Crawling'],
    comprehending: ['badge-blue', 'Processing'],
    storing: ['badge-blue', 'Storing'],
    pending: ['badge-gray', 'Pending'],
    unknown: ['badge-gray', 'Unknown'],
  }
  const [cls, label] = map[status] || ['badge-gray', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

function ScoreRing({ score, size = 80 }) {
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--blue)' : score >= 40 ? 'var(--yellow)' : 'var(--red)'
  const r = size / 2 - 7
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border2)" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.15, color: 'var(--muted)', marginTop: 2 }}>{grade}</span>
      </div>
    </div>
  )
}

function CopyBtn({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)
  return (
    <button className="btn btn-ghost btn-sm" onClick={() => {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }}>
      {copied ? '✓ Copied!' : label}
    </button>
  )
}

function MiniBar({ value, max, color }) {
  const pct = Math.round((value / (max || 1)) * 100)
  return (
    <div style={{ background: 'var(--border)', borderRadius: 3, height: 5, flex: 1 }}>
      <div style={{ height: 5, borderRadius: 3, background: color || 'var(--accent2)', width: `${pct}%`, transition: 'width 0.4s' }} />
    </div>
  )
}

function PageHeader({ title, subtitle }) {
  return (
    <div className="section-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-state-icon">{icon}</div>
        <div className="empty-state-title">{title}</div>
        <div className="empty-state-desc">{description}</div>
        {action && <div style={{ marginTop: 16 }}>{action}</div>}
      </div>
    </div>
  )
}

// ── Tab Explainer — shown at top of every tab ─────────────────────────────
function TabExplainer({ icon, title, description, features, cta, onCta, ctaLabel = 'Get started →' }) {
  return (
    <div style={{
      borderRadius: 16,
      background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
      border: '1px solid var(--border)',
      padding: '28px 32px',
      marginBottom: 4,
    }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent)22, var(--accent2)22)',
          border: '1px solid var(--accent)33',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6, letterSpacing: '-0.2px' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 560, marginBottom: features ? 20 : 0 }}>{description}</div>
          {features && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {features.map(({ icon: fi, label, sub }) => (
                <div key={label} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 12px',
                }}>
                  <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.3 }}>{fi}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {cta && onCta && (
            <button className="btn btn-primary btn-sm" onClick={onCta} style={{ marginTop: features ? 16 : 0 }}>
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sidebar Navigation ────────────────────────────────────────────────────────
const NAV_LINKS = [
  { id: 'overview',        label: 'Overview',        icon: '⊞' },
  { id: 'score',           label: 'AI Score',         icon: '◎' },
  { id: 'geo',             label: 'GEO',              icon: '◈' },
  { id: 'analytics',       label: 'Analytics',        icon: '↗' },
  { id: 'content-doctor',  label: 'Content Doctor',   icon: '✦', highlight: true },
  { id: 'citations',       label: 'Citations',        icon: '◉' },
  { id: 'snippet',         label: 'Snippet',          icon: '⟨⟩' },
  { id: 'settings',        label: 'Settings',         icon: '⚙' },
]

function Nav({ page, setPage, health, theme, toggleTheme }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <a
        href="/"
        className="sidebar-logo"
        onClick={e => { e.preventDefault(); setPage('overview') }}
      >
        <div className="sidebar-logo-icon">g</div>
        <span>galuli</span>
      </a>

      {/* Main nav */}
      <div className="sidebar-section">
        {NAV_LINKS.map(l => (
          <button
            key={l.id}
            className={`sidebar-item${page === l.id ? ' active' : ''}`}
            onClick={() => setPage(l.id)}
          >
            <span className="sidebar-item-icon">{l.icon}</span>
            <span>{l.label}</span>
            {l.highlight && (
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                background: 'rgba(94,106,210,0.15)', color: 'var(--accent)',
                padding: '1px 5px', borderRadius: 3, letterSpacing: 0.3,
              }}>NEW</span>
            )}
          </button>
        ))}
      </div>

      {/* Footer — status + theme toggle */}
      <div className="sidebar-footer">
        {health && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', marginBottom: 8, padding: '0 4px' }}>
            <span className={`dot dot-${health.anthropic_configured ? 'green' : 'red'}`} />
            <span>{health.registries_indexed} site{health.registries_indexed !== 1 ? 's' : ''} indexed</span>
          </div>
        )}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="sidebar-item"
          style={{ width: '100%' }}
        >
          <span className="sidebar-item-icon">{theme === 'dark' ? '☀' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  )
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewPage({ setPage, setPendingScanDomain }) {
  const [registries, setRegistries] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [scanUrl, setScanUrl] = useState('')
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    Promise.all([
      api.listRegistries().catch(() => ({ registries: [] })),
    ]).then(([r]) => {
      const regs = r?.registries || []
      setRegistries(regs)
      regs.forEach(reg => {
        api.getScore(reg.domain)
          .then(s => setScores(prev => ({ ...prev, [reg.domain]: s })))
          .catch(() => { })
      })
    }).finally(() => setLoading(false))
  }, [])

  const handleScan = async (e) => {
    e.preventDefault()
    if (!scanUrl.trim()) return
    setScanning(true)
    try {
      const res = await api.ingest(scanUrl.trim(), false)
      setScanUrl('')
      toast.success(`Scanning ${res.domain} — your AI Score will appear in ~60s`)
      setPendingScanDomain(res.domain)
      setPage('score')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setScanning(false)
    }
  }

  const handleDelete = async (domain) => {
    if (!confirm(`Remove ${domain} from your dashboard?\n\nThis deletes the registry and all scan data. It cannot be undone.`)) return
    try {
      await api.deleteRegistry(domain)
      setRegistries(prev => prev.filter(r => r.domain !== domain))
      setScores(prev => { const n = { ...prev }; delete n[domain]; return n })
      toast.success(`${domain} removed`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return (
    <div className="flex center gap-12" style={{ padding: 32, color: 'var(--muted)' }}>
      <span className="spinner" /> Loading…
    </div>
  )

  const hasData = registries.length > 0
  const scores_arr = Object.values(scores)
  const avgScore = scores_arr.length > 0
    ? Math.round(scores_arr.reduce((a, b) => a + b.total, 0) / scores_arr.length)
    : null

  return (
    <div className="flex col gap-20">
      <PageHeader title="Overview" subtitle="Your AI accessibility dashboard" />

      {/* Quick scan */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Scan a site</div>
        <form onSubmit={handleScan} style={{ display: 'flex', gap: 8 }}>
          <input
            value={scanUrl}
            onChange={e => setScanUrl(e.target.value)}
            placeholder="https://yoursite.com"
            style={{ flex: 1 }}
            disabled={scanning}
          />
          <button className="btn btn-primary" disabled={scanning || !scanUrl.trim()} style={{ flexShrink: 0, minWidth: 100 }}>
            {scanning ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Scanning…</> : 'Scan →'}
          </button>
        </form>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
          Free · Results appear in AI Score tab in ~60 seconds
        </p>
      </div>

      {/* Stats row */}
      {hasData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {[
            { label: 'Sites indexed', value: registries.length, color: 'var(--accent)' },
            { label: 'Avg AI score', value: avgScore !== null ? `${avgScore}/100` : '—', color: avgScore >= 70 ? 'var(--green)' : avgScore >= 50 ? 'var(--yellow)' : 'var(--red)' },
            { label: 'WebMCP sites', value: scores_arr.filter(s => s?.dimensions?.webmcp_compliance?.webmcp_enabled).length, color: 'var(--purple)' },
          ].map(c => (
            <div key={c.label} className="stat-card">
              <div className="stat-value" style={{ color: c.color, fontSize: 14 }}>{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sites list */}
      {hasData && (
        <div className="flex col gap-2">
          <div className="flex between center" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--subtle)' }}>Indexed sites</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('registries')}>View all →</button>
          </div>
          {registries.map(r => {
            const s = scores[r.domain]
            const scoreColor = s ? (s.total >= 70 ? 'var(--green)' : s.total >= 50 ? 'var(--yellow)' : 'var(--red)') : 'var(--muted)'
            return (
              <div key={r.domain} className="card" style={{ padding: '14px 18px' }}>
                <div className="flex center gap-16 wrap">
                  {s ? <ScoreRing score={s.total} size={56} /> : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" style={{ width: 16, height: 16 }} /></div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{r.domain}</div>
                    {s && <div style={{ fontSize: 13, color: scoreColor }}>{s.label} · {s.total}/100 · Grade {s.grade}</div>}
                    {s?.suggestions?.[0]?.issue && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>💡 {s.suggestions[0].issue}</div>}
                  </div>
                  <div className="flex gap-6 wrap" style={{ flexShrink: 0, alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPage('score')}>Score</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPage('analytics')}>Analytics</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPage('snippet')}>Install</button>
                    <button
                      onClick={() => handleDelete(r.domain)}
                      title={`Remove ${r.domain}`}
                      style={{
                        width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)',
                        background: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.15s, border-color 0.15s, background 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef444466'; e.currentTarget.style.background = '#ef444415' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'none' }}
                    >×</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state + explainer */}
      {!hasData && (
        <TabExplainer
          icon="🏠"
          title="Welcome to Galuli — your AI readability dashboard"
          description="Paste any URL in the box above to run your first scan. Galuli crawls every page, runs a 4-pass AI analysis, and gives you an AI Readiness Score in under 2 minutes. No install needed for the free scan."
          features={[
            { icon: '🔍', label: 'Free instant scan', sub: 'Paste any URL — results in ~60 seconds' },
            { icon: '📊', label: 'AI Readiness Score', sub: '0-100 score across 5 AI-readiness dimensions' },
            { icon: '📡', label: 'AI traffic analytics', sub: 'See which LLMs crawl your site and what they read' },
            { icon: '🩺', label: 'Content Doctor', sub: 'Find authority gaps and structural issues AI won\'t trust' },
            { icon: '🌐', label: 'GEO Score', sub: 'How likely each AI system is to cite your site' },
            { icon: '⬡', label: 'One-line install', sub: 'Snippet unlocks live monitoring + WebMCP tools' },
          ]}
          cta={true}
          onCta={() => setPage('snippet')}
          ctaLabel="View install guide →"
        />
      )}

      {/* Snippet CTA — only if no snippet yet */}
      {hasData && scores_arr.every(s => !s?.dimensions?.webmcp_compliance?.webmcp_enabled) && (
        <div className="card flex between center wrap gap-16" style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', padding: '16px 20px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>Snippet not installed</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Add one script tag to unlock live AI agent tracking + WebMCP.</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setPage('snippet')}>Get install code →</button>
        </div>
      )}
    </div>
  )
}

// ── Index a Site (Ingest) ────────────────────────────────────────────────────
function IngestPage() {
  const [url, setUrl] = useState('')
  const [force, setForce] = useState(false)
  const [loading, setLoading] = useState(false)
  const [job, setJob] = useState(null)
  const [polling, setPolling] = useState(false)
  const [result, setResult] = useState(null)
  const [loadingResult, setLoadingResult] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true); setJob(null); setResult(null)
    try {
      const res = await api.ingest(url.trim(), force)
      setJob(res)
      if (res.status === 'complete') {
        toast.success(`Already indexed — loading results`)
        loadResult(res.domain)
      } else {
        toast.info(`Indexing started for ${res.domain}`)
        setPolling(true)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadResult = async (domain) => {
    setLoadingResult(true)
    try {
      const [registry, score] = await Promise.all([
        api.getRegistry(domain),
        api.getScore(domain),
      ])
      setResult({ registry, score })
    } catch { }
    setLoadingResult(false)
  }

  useEffect(() => {
    if (!polling || !job?.job_id || job.job_id === 'cached') return
    const i = setInterval(async () => {
      try {
        const u = await api.pollJob(job.job_id)
        setJob(j => ({ ...j, ...u }))
        if (['complete', 'failed'].includes(u.status)) {
          setPolling(false)
          if (u.status === 'complete') {
            toast.success(`Done! Loading results for ${job.domain}`)
            loadResult(job.domain)
          } else {
            toast.error(`Failed: ${u.error}`)
          }
        }
      } catch { }
    }, 800)
    return () => clearInterval(i)
  }, [polling, job])

  const stageMap = { pending: 0, crawling: 1, comprehending: 2, storing: 3, complete: 4, failed: 4 }
  const stages = [
    { label: 'Crawling pages', desc: 'Fetching all pages on the site' },
    { label: 'AI comprehension', desc: '4-pass LLM pipeline — extracting capabilities, pricing, integrations' },
    { label: 'Building schema', desc: 'Structuring data into registry format' },
    { label: 'Storing', desc: 'Saving to database and generating outputs' },
  ]

  return (
    <div className="flex col gap-24" style={{ maxWidth: 740 }}>
      <PageHeader
        title="Index a site"
        subtitle="Enter any URL. We crawl it, run a 4-pass AI pipeline, and show you exactly what AI agents will see."
      />

      <form onSubmit={submit} className="card flex col gap-16">
        <div>
          <label className="label">Website URL</label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://yoursite.com"
            disabled={loading || polling}
            style={{ fontSize: 13 }}
          />
        </div>
        <div className="flex center gap-12">
          <label className="flex center gap-8" style={{ cursor: 'pointer', userSelect: 'none', color: 'var(--muted)', fontSize: 13 }}>
            <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} style={{ width: 'auto', cursor: 'pointer' }} />
            Force re-crawl
          </label>
          <div className="grow" />
          <button className="btn btn-primary" disabled={loading || polling || !url.trim()} style={{ minWidth: 130 }}>
            {loading || polling
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Working…</>
              : '→ Index site'}
          </button>
        </div>
      </form>

      {/* Progress */}
      {job && !['complete', 'failed'].includes(job.status) && (
        <div className="card flex col gap-20">
          <div className="flex center between">
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{job.domain}</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{job.job_id}</div>
            </div>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex col gap-12">
            {stages.map(({ label, desc }, i) => {
              const cur = stageMap[job.status] || 0
              const stageNum = i + 1
              const done = cur > stageNum
              const active = cur === stageNum
              return (
                <div key={label} className="flex gap-14 center" style={{ opacity: active || done ? 1 : 0.35 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#10b98120' : active ? '#6366f120' : 'var(--border)', border: `1px solid ${done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border2)'}` }}>
                    {done
                      ? <span style={{ color: 'var(--green)', fontSize: 13 }}>✓</span>
                      : active
                        ? <span className="spinner" style={{ width: 12, height: 12 }} />
                        : <span style={{ color: 'var(--muted)', fontSize: 13 }}>{stageNum}</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'var(--text)' : done ? 'var(--subtle)' : 'var(--muted)' }}>{label}</div>
                    {active && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {job?.status === 'failed' && (
        <div className="card" style={{ borderColor: 'var(--red)', background: '#ef444408' }}>
          <div style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 6 }}>Indexing failed</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{job.error || 'Unknown error. Check the URL and try again.'}</div>
        </div>
      )}

      {/* Loading result */}
      {loadingResult && (
        <div className="flex center gap-12" style={{ padding: 32, color: 'var(--muted)' }}>
          <span className="spinner" /> Loading results…
        </div>
      )}

      {/* Results */}
      {result && <IndexResult result={result} />}
    </div>
  )
}

function IndexResult({ result }) {
  const { registry, score } = result
  const gradeColor = score.total >= 70 ? 'var(--green)' : score.total >= 50 ? 'var(--yellow)' : 'var(--red)'
  const dimLabels = { content_coverage: 'Content Coverage', structure_quality: 'Structure Quality', freshness: 'Freshness', webmcp_compliance: 'WebMCP Compliance', output_formats: 'Output Formats' }
  const dimColors = { content_coverage: 'var(--accent2)', structure_quality: 'var(--green)', freshness: 'var(--blue)', webmcp_compliance: 'var(--purple)', output_formats: 'var(--yellow)' }
  const priorityColor = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--muted)' }

  return (
    <div className="flex col gap-16">
      {/* Score hero */}
      <div className="card" style={{ borderColor: gradeColor, background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)' }}>
        <div className="flex center gap-24 wrap">
          <ScoreRing score={score.total} size={110} />
          <div className="flex col gap-8" style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{score.label}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{registry.domain}</div>
            <div style={{ fontSize: 13, color: 'var(--subtle)', marginTop: 2, lineHeight: 1.5 }}>
              {registry.metadata?.description}
            </div>
            <div className="flex gap-8 wrap" style={{ marginTop: 6 }}>
              <span className="badge badge-blue">{score.total}/100</span>
              <span className={`badge ${score.total >= 70 ? 'badge-green' : score.total >= 50 ? 'badge-yellow' : 'badge-red'}`}>Grade {score.grade}</span>
              {registry.metadata?.category && <span className="badge badge-gray">{registry.metadata.category}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="card flex col gap-14">
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Score breakdown</div>
        {Object.entries(score.dimensions || {}).map(([key, dim]) => (
          <div key={key}>
            <div className="flex between" style={{ fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 500 }}>{dimLabels[key] || key}</span>
              <span style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{dim.score}<span style={{ color: 'var(--border2)' }}>/{dim.max}</span></span>
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 4, height: 6 }}>
              <div style={{
                height: 6, borderRadius: 4,
                background: dimColors[key] || 'var(--accent2)',
                width: `${Math.round((dim.score / dim.max) * 100)}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Capabilities */}
      {registry.capabilities?.length > 0 && (
        <div className="card flex col gap-12">
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>What AI agents now know about {registry.domain}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>
              {registry.capabilities.length} capabilities extracted by the AI pipeline
            </div>
          </div>
          {registry.capabilities.map(cap => (
            <div key={cap.id} className="capability">
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{cap.name}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{cap.description}</div>
              {cap.use_cases?.length > 0 && (
                <div className="flex wrap gap-6" style={{ marginTop: 8 }}>
                  {cap.use_cases.slice(0, 4).map(u => (
                    <span key={u} style={{ fontSize: 13, background: 'var(--border)', color: 'var(--subtle)', padding: '2px 8px', borderRadius: 4 }}>{u}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {score.suggestions?.length > 0 && (
        <div className="card flex col gap-10">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>How to improve your score</div>
          {score.suggestions.map((s, i) => (
            <div key={i} className={`suggestion suggestion-${s.priority}`}>
              <div className="flex center gap-8" style={{ marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: priorityColor[s.priority], textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.priority}</span>
                <span style={{ color: 'var(--border2)' }}>·</span>
                <span style={{ fontSize: 13, color: 'var(--subtle)', fontWeight: 600 }}>{s.dimension}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{s.issue}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{s.fix}</div>
            </div>
          ))}
        </div>
      )}

      {/* Next step */}
      <div className="card flex col gap-14" style={{ background: 'linear-gradient(135deg, #0f1020 0%, #0a0a18 100%)', borderColor: 'var(--accent)' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5 }}>Next step: install the snippet</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
            Add one script tag to your site's <code>&lt;head&gt;</code> to unlock AI agent tracking, WebMCP auto-registration, and live score updates.
          </div>
        </div>
        <div className="code-block">
          {`<script src="${api.base()}/galuli.js?key=${localStorage.getItem('galuli_api_key') || 'YOUR_KEY'}" async></script>`}
          <div className="copy-btn-abs">
            <CopyBtn text={`<script src="${api.base()}/galuli.js?key=${localStorage.getItem('galuli_api_key') || 'YOUR_KEY'}" async></script>`} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AI Score ─────────────────────────────────────────────────────────────────
function ScorePage({ pendingDomain, clearPending }) {
  const [registries, setRegistries] = useState([])
  const [selected, setSelected] = useState('')
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [badgeTab, setBadgeTab] = useState('preview')
  const [polling, setPolling] = useState(false)

  const loadScore = (domain) => {
    setSelected(domain); setLoading(true); setScore(null)
    api.getScore(domain).then(setScore).catch(() => { }).finally(() => setLoading(false))
  }

  useEffect(() => {
    api.listRegistries().then(r => {
      const regs = r.registries || []
      setRegistries(regs)
      // If we came from a scan, select that domain; else pick the first
      const target = pendingDomain || (regs.length > 0 ? regs[0].domain : null)
      if (target) loadScore(target)
    }).catch(() => { })
  }, [])

  // Poll every 5s when there's a pending scan until score appears
  useEffect(() => {
    if (!pendingDomain) return
    setPolling(true)
    const interval = setInterval(() => {
      api.listRegistries().then(r => {
        const regs = r.registries || []
        setRegistries(regs)
        const found = regs.find(r => r.domain === pendingDomain)
        if (found) {
          api.getScore(pendingDomain).then(s => {
            setScore(s)
            setSelected(pendingDomain)
            setPolling(false)
            clearPending()
            clearInterval(interval)
          }).catch(() => { })
        }
      }).catch(() => { })
    }, 5000)
    return () => clearInterval(interval)
  }, [pendingDomain])

  const dimLabels = { content_coverage: 'Content Coverage', structure_quality: 'Structure Quality', freshness: 'Freshness', webmcp_compliance: 'WebMCP Compliance', output_formats: 'Output Formats' }
  const dimColors = { content_coverage: 'var(--accent2)', structure_quality: 'var(--green)', freshness: 'var(--blue)', webmcp_compliance: 'var(--purple)', output_formats: 'var(--yellow)' }
  const dimDesc = {
    content_coverage: 'How well your site\'s capabilities, use cases, and value proposition are extracted and described. Low score = AI agents can\'t explain what you do.',
    structure_quality: 'Completeness of structured data: pricing, API info, schema.org markup, headings hierarchy. Low score = AI gives incomplete or inaccurate answers about your product.',
    freshness: 'How recently your registry was updated relative to your actual site. Stale data = AI agents cite outdated information.',
    webmcp_compliance: 'Whether the Galuli snippet is installed and WebMCP tools are registered. Without this, AI agents can\'t interact with your site\'s forms or actions.',
    output_formats: 'Whether your llms.txt, JSON registry, and AI plugin manifest are generated and accessible. These are what AI crawlers actually fetch.',
  }
  const priorityColor = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--muted)' }

  return (
    <div className="flex col gap-24">
      <div className="flex between center wrap gap-12">
        <PageHeader title="AI Readability Score" subtitle="How well can AI systems read, understand, and trust your site?" />
        {registries.length > 0 && (
          <select value={selected} onChange={e => loadScore(e.target.value)} style={{ width: 'auto', minWidth: 200 }}>
            {registries.map(r => <option key={r.domain} value={r.domain}>{r.domain}</option>)}
          </select>
        )}
      </div>

      {/* Scanning / polling state */}
      {polling && (
        <div className="card flex col gap-16" style={{ padding: '32px 28px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Scanning {pendingDomain}…</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
            We're crawling every page, running the 4-pass AI pipeline, and calculating your AI Readiness Score.
            This usually takes <strong>30–90 seconds</strong>.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320, margin: '8px auto 0' }}>
            {[
              { icon: '🔍', label: 'Crawling all pages' },
              { icon: '🤖', label: 'Running AI comprehension pipeline' },
              { icon: '📊', label: 'Calculating AI Readiness Score' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--subtle)' }}>
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!polling && registries.length === 0 && (
        <TabExplainer
          icon="◈"
          title="AI Readiness Score — understand exactly how AI sees your site"
          description="The AI Readiness Score measures how well any AI agent can find, understand, and use your site. It's a 0–100 score across 5 dimensions. Scan a site from Overview to see yours."
          features={[
            { icon: '📝', label: 'Content Coverage (0–25)', sub: 'Are your capabilities, use cases, and value prop clearly documented?' },
            { icon: '🏗️', label: 'Structure Quality (0–20)', sub: 'Pricing tiers, API docs, auth methods, SDK info' },
            { icon: '📡', label: 'Machine Signals (0–20)', sub: 'llms.txt, ai-plugin.json, WebMCP, confidence score' },
            { icon: '🏛️', label: 'Authority (0–20)', sub: 'Docs URL, support URL, pricing page, status page' },
            { icon: '⏱️', label: 'Freshness (0–15)', sub: 'Pages crawled + whether snippet monitors live changes' },
            { icon: '🏷️', label: 'Embeddable badge', sub: 'Show visitors you\'re AI-ready — auto-updates with score' },
          ]}
        />
      )}

      {!polling && loading && <div className="flex center gap-12" style={{ padding: 40, color: 'var(--muted)' }}><span className="spinner" /> Calculating score…</div>}

      {!polling && !loading && score && (
        <>
          {/* Score hero */}
          <div className="card" style={{ padding: '28px 32px' }}>
            <div className="flex center gap-32 wrap">
              <ScoreRing score={score.total} size={130} />
              <div className="flex col gap-10" style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px' }}>{score.label}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{selected}</div>
                <div className="flex gap-8 wrap" style={{ marginTop: 4 }}>
                  <span className="badge badge-blue">Score: {score.total}/100</span>
                  <span className={`badge ${score.total >= 70 ? 'badge-green' : score.total >= 50 ? 'badge-yellow' : 'badge-red'}`}>Grade: {score.grade}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  Calculated {new Date(score.calculated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Score scale */}
          <div className="card flex col gap-10">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Score scale</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { range: '90–100', grade: 'A+', color: 'var(--green)', label: 'Elite — fully AI-optimized' },
                { range: '70–89', grade: 'B', color: 'var(--blue)', label: 'Good — minor improvements needed' },
                { range: '50–69', grade: 'C', color: 'var(--yellow)', label: 'Average — AI may miss key info' },
                { range: '30–49', grade: 'D', color: 'var(--red)', label: 'Poor — high invisibility risk' },
                { range: '0–29', grade: 'F', color: '#991b1b', label: 'Not readable by AI' },
              ].map(({ range, grade, color, label }) => (
                <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', flex: '1 1 160px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 13, flexShrink: 0 }}>{grade}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{range}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="card flex col gap-16">
            <div style={{ fontWeight: 700, fontSize: 13 }}>Score breakdown</div>
            {Object.entries(score.dimensions || {}).map(([key, dim]) => (
              <div key={key} className="flex col gap-6">
                <div className="flex between center" style={{ fontSize: 13 }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{dimLabels[key] || key}</span>
                    <span style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 8 }}>{dimDesc[key]}</span>
                  </div>
                  <span style={{ color: 'var(--subtle)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {dim.score}<span style={{ color: 'var(--muted)', fontWeight: 400 }}>/{dim.max}</span>
                  </span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 4, height: 7 }}>
                  <div style={{ height: 7, borderRadius: 4, background: dimColors[key] || 'var(--accent2)', width: `${(dim.score / dim.max) * 100}%`, transition: 'width 0.6s' }} />
                </div>
                {key === 'webmcp_compliance' && (
                  <div className="flex gap-16" style={{ fontSize: 13, color: 'var(--muted)' }}>
                    <span>{dim.webmcp_enabled ? '✓ WebMCP active' : '○ WebMCP pending (install snippet)'}</span>
                    {dim.tools_registered > 0 && <span>{dim.tools_registered} tools</span>}
                  </div>
                )}
                {key === 'freshness' && dim.age_days !== null && (
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Last updated {dim.age_days === 0 ? 'today' : `${dim.age_days} day${dim.age_days !== 1 ? 's' : ''} ago`}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suggestions */}
          {score.suggestions?.length > 0 && (
            <div className="card flex col gap-10">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Improvement suggestions</div>
              {score.suggestions.map((s, i) => (
                <div key={i} className={`suggestion suggestion-${s.priority}`}>
                  <div className="flex center gap-8" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: priorityColor[s.priority], textTransform: 'uppercase' }}>{s.priority}</span>
                    <span style={{ color: 'var(--border2)' }}>·</span>
                    <span style={{ fontSize: 13, color: 'var(--subtle)' }}>{s.dimension}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{s.issue}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{s.fix}</div>
                </div>
              ))}
            </div>
          )}

          {/* Badge */}
          <div className="card flex col gap-16">
            <div style={{ fontWeight: 700, fontSize: 13 }}>Embeddable badge</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Show visitors your AI Readiness score. Updates automatically when your score changes.
            </div>
            <div className="tabs">
              {['preview', 'html', 'markdown'].map(t => (
                <button key={t} className={`tab ${badgeTab === t ? 'active' : ''}`} onClick={() => setBadgeTab(t)}>{t}</button>
              ))}
            </div>
            {badgeTab === 'preview' && (
              <div className="flex col gap-12">
                <img src={api.getBadgeUrl(selected)} alt="AI Readiness Badge" style={{ height: 28 }} />
              </div>
            )}
            {badgeTab === 'html' && (
              <div className="flex col gap-10">
                <div className="code-block">
                  {`<a href="${api.base()}/api/v1/score/${selected}" target="_blank">\n  <img src="${api.getBadgeUrl(selected)}" alt="AI-Ready" />\n</a>`}
                  <div className="copy-btn-abs">
                    <CopyBtn text={`<a href="${api.base()}/api/v1/score/${selected}" target="_blank"><img src="${api.getBadgeUrl(selected)}" alt="AI-Ready" /></a>`} />
                  </div>
                </div>
              </div>
            )}
            {badgeTab === 'markdown' && (
              <div className="flex col gap-10">
                <div className="code-block">
                  {`[![AI-Ready](${api.getBadgeUrl(selected)})](${api.base()}/api/v1/score/${selected})`}
                  <div className="copy-btn-abs">
                    <CopyBtn text={`[![AI-Ready](${api.getBadgeUrl(selected)})](${api.base()}/api/v1/score/${selected})`} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Analytics ─────────────────────────────────────────────────────────────────
const AGENT_COLORS = {
  'GPTBot': '#10b981', 'ChatGPT': '#10b981', 'OpenAI Search': '#10b981',
  'ClaudeBot': '#f59e0b', 'Claude Web': '#f59e0b', 'Anthropic': '#f59e0b',
  'PerplexityBot': '#3b82f6', 'Perplexity': '#3b82f6',
  'Gemini': '#8b5cf6', 'Google Extended': '#8b5cf6',
  'BingBot': '#06b6d4', 'WebMCP Agent': '#ec4899',
}

const TREND_ICON = { growing: '↑', stable: '→', declining: '↓' }
const TREND_COLOR = { growing: 'var(--green)', stable: 'var(--muted)', declining: 'var(--red)' }

function AnalyticsPage({ setPage }) {
  const [registries, setRegistries] = useState([])
  const [selected, setSelected] = useState('')
  const [days, setDays] = useState(30)
  const [summary, setSummary] = useState(null)
  const [agents, setAgents] = useState([])
  const [pages, setPages] = useState([])
  const [attention, setAttention] = useState(null)
  const [topics, setTopics] = useState([])
  const [llmDepth, setLlmDepth] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.listRegistries().then(r => {
      const regs = r.registries || []
      setRegistries(regs)
      if (regs.length > 0 && !selected) setSelected(regs[0].domain)
    }).catch(() => { })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    Promise.all([
      api.getAnalytics(selected, days),
      api.getAgentBreakdown(selected, days),
      api.getPageBreakdown(selected, days),
      api.getAttentionScore(selected, days).catch(() => null),
      api.getTopicMap(selected, days).catch(() => ({ topics: [] })),
      api.getLlmDepth(selected, days).catch(() => ({ agents: [] })),
    ]).then(([s, a, p, att, top, depth]) => {
      setSummary(s)
      setAgents(a.agents || [])
      setPages(p.pages || [])
      setAttention(att)
      setTopics(top.topics || [])
      setLlmDepth(depth.agents || [])
    }).catch(() => {
      setSummary({ total_ai_hits: 0, unique_agents: 0, top_agents: [], daily_trend: [] })
    }).finally(() => setLoading(false))
  }, [selected, days])

  const maxHits = agents.length > 0 ? Math.max(...agents.map(a => a.hits)) : 1

  // AI Attention Score ring colors
  const attScore = attention?.score || 0
  const attColor = attScore >= 70 ? 'var(--green)' : attScore >= 40 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div className="flex col gap-24">
      <div className="flex between center wrap gap-12">
        <PageHeader title="AI Traffic Analytics" subtitle="Which AI agents are visiting your site and what they're reading" />
        <div className="flex gap-10 center">
          {registries.length > 0 && (
            <select value={selected} onChange={e => setSelected(e.target.value)} style={{ width: 'auto' }}>
              {registries.map(r => <option key={r.domain} value={r.domain}>{r.domain}</option>)}
            </select>
          )}
          <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ width: 'auto' }}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {!loading && registries.length === 0 && (
        <TabExplainer
          icon="📡"
          title="AI Traffic Analytics — see who's reading your site right now"
          description="Galuli detects 30+ AI crawlers and logs every visit in real time. Scan a site from Overview first, then install the snippet to start seeing live AI agent traffic."
          features={[
            { icon: '🤖', label: 'AI Attention Score', sub: 'Composite score: frequency × depth × recency × diversity' },
            { icon: '🗺️', label: 'Topic Attention Map', sub: 'Which content areas AI reads most vs. ignores' },
            { icon: '🔬', label: 'Per-LLM crawl depth', sub: 'Which AI systems go deep vs. skim your site' },
            { icon: '📈', label: 'Daily trend chart', sub: 'AI traffic over time — spot spikes and drops' },
            { icon: '🏆', label: 'Top pages by AI hits', sub: 'Which URLs LLMs fetch most often' },
            { icon: '⚡', label: 'Agent breakdown', sub: 'GPTBot, ClaudeBot, PerplexityBot, Gemini and more' },
          ]}
        />
      )}

      {loading && <div className="flex center gap-12" style={{ padding: 40, color: 'var(--muted)' }}><span className="spinner" /> Loading…</div>}

      {!loading && summary && summary.total_ai_hits === 0 && (
        <div className="flex col gap-16">
          <TabExplainer
            icon="📡"
            title="AI Traffic Analytics — see who's reading your site right now"
            description={`The snippet detects 30+ AI crawlers and logs every visit — agent name, page visited, timestamp. Once installed on ${selected || 'your site'}, this tab shows a live feed of AI attention.`}
            features={[
              { icon: '🤖', label: 'AI Attention Score', sub: 'Composite score: frequency × depth × recency × diversity' },
              { icon: '🗺️', label: 'Topic Attention Map', sub: 'Which content areas AI reads most vs. ignores' },
              { icon: '🔬', label: 'Per-LLM crawl depth', sub: 'Which AI systems go deep vs. skim your site' },
              { icon: '📈', label: 'Daily trend chart', sub: 'AI traffic over time — spot spikes and drops' },
              { icon: '🏆', label: 'Top pages by AI hits', sub: 'Which URLs LLMs fetch most often' },
              { icon: '⚡', label: 'Agent breakdown', sub: 'GPTBot, ClaudeBot, PerplexityBot, Gemini and more' },
            ]}
            cta={true}
            onCta={() => setPage('snippet')}
            ctaLabel="Install snippet to start tracking →"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--muted)' }}>
            <span style={{ fontSize: 13 }}>💡</span>
            <span>No AI traffic recorded yet for <strong style={{ color: 'var(--text)' }}>{selected}</strong>. This is normal for new installs — AI crawlers visit on their own schedule, typically within 24–72 hours.</span>
          </div>
        </div>
      )}

      {!loading && summary && summary.total_ai_hits > 0 && (
        <>
          {/* ── AI Attention Score hero ── */}
          {attention && (
            <div className="card" style={{ padding: '24px 28px', borderTop: '3px solid var(--accent2)' }}>
              <div className="flex center gap-28 wrap">
                {/* Score ring */}
                <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                  <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={55} cy={55} r={44} fill="none" stroke="var(--border2)" strokeWidth={8} />
                    <circle cx={55} cy={55} r={44} fill="none" stroke={attColor} strokeWidth={8}
                      strokeDasharray={`${(attScore / 100) * (2 * Math.PI * 44)} ${2 * Math.PI * 44}`}
                      strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.7s ease' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: attColor, lineHeight: 1 }}>{attScore}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{attention.grade}</span>
                  </div>
                </div>
                {/* Score details */}
                <div className="flex col gap-10" style={{ flex: 1 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>AI Attention Score</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{attention.insight}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { label: 'Frequency', val: attention.components?.frequency, max: 40 },
                      { label: 'Depth', val: attention.components?.depth, max: 35 },
                      { label: 'Recency', val: attention.components?.recency, max: 25 },
                      { label: 'Diversity', val: attention.components?.diversity_bonus, max: 10 },
                    ].map(c => (
                      <div key={c.label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 10px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: attColor }}>{c.val}<span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>/{c.max}</span></div>
                        <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', marginTop: 5 }}>
                          <div style={{ height: 3, borderRadius: 2, background: attColor, width: (c.val / c.max * 100) + '%', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'Total AI visits', value: summary.total_ai_hits, color: 'var(--accent2)' },
              { label: 'Unique agents', value: summary.unique_agents, color: 'var(--green)' },
              { label: 'Top agent', value: summary.top_agents?.[0]?.agent_name || '—', color: 'var(--blue)' },
              { label: 'Most visited', value: summary.top_pages?.[0]?.hits ? summary.top_pages[0].hits + ' hits' : '—', color: 'var(--yellow)' },
            ].map(c => (
              <div key={c.label} className="stat-card">
                <div className="stat-value" style={{ color: c.color, fontSize: c.label === 'Top agent' ? 16 : 24 }}>{c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            ))}
          </div>

          {/* ── Topic Map ── */}
          {topics.length > 0 && (
            <div className="card flex col gap-14">
              <div className="flex between center">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>AI Attention by Content Topic</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Which content areas attract the most AI crawler attention</div>
                </div>
              </div>
              <div className="flex col gap-10">
                {topics.map((t, i) => (
                  <div key={t.topic}>
                    <div className="flex between center" style={{ marginBottom: 5 }}>
                      <div className="flex center gap-10">
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', width: 16 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{t.topic}</span>
                        <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t.unique_pages} page{t.unique_pages !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex center gap-8">
                        {t.top_agents.slice(0, 3).map(a => (
                          <span key={a.agent} style={{ fontSize: 10, background: (AGENT_COLORS[a.agent] || '#6b7280') + '22', color: AGENT_COLORS[a.agent] || 'var(--muted)', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>
                            {a.agent.replace('Bot', '').replace('bot', '')}
                          </span>
                        ))}
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)', fontVariantNumeric: 'tabular-nums', minWidth: 44, textAlign: 'right' }}>{t.total_hits} visits</span>
                      </div>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'var(--border)' }}>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--accent2)', width: t.attention_pct + '%', opacity: 0.75, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent breakdown + top pages */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card flex col gap-14">
              <div style={{ fontWeight: 700, fontSize: 13 }}>AI agents visiting</div>
              {agents.length === 0
                ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>No agent data</div>
                : agents.map(a => (
                  <div key={a.agent_name} className="flex center gap-12">
                    <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: AGENT_COLORS[a.agent_name] || 'var(--muted)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex between" style={{ fontSize: 13, marginBottom: 5 }}>
                        <span style={{ fontWeight: 500 }}>{a.agent_name}</span>
                        <span style={{ color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{a.hits} visits</span>
                      </div>
                      <MiniBar value={a.hits} max={maxHits} color={AGENT_COLORS[a.agent_name] || 'var(--accent2)'} />
                    </div>
                  </div>
                ))
              }
            </div>

            <div className="card flex col gap-12">
              <div style={{ fontWeight: 700, fontSize: 13 }}>Most visited pages</div>
              {pages.length === 0
                ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>No page data</div>
                : pages.slice(0, 8).map((p, i) => (
                  <div key={p.page_url} className="flex center gap-12" style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--muted)', width: 18, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                    <span style={{ flex: 1, color: 'var(--accent2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.page_url.replace(/^https?:\/\/[^/]+/, '') || '/'}
                    </span>
                    <span style={{ color: 'var(--muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{p.total_hits}x</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* ── Per-LLM Depth Analysis ── */}
          {llmDepth.length > 0 && (
            <div className="card flex col gap-14">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Per-LLM Crawl Depth</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  How deep each AI system goes vs. how many pages they revisit
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Agent', 'Total visits', 'Unique pages', 'Depth ratio', 'Trend', 'Last seen'].map(h => (
                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 13, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {llmDepth.map(a => (
                      <tr key={a.agent_name} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                          <div className="flex center gap-8">
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: AGENT_COLORS[a.agent_name] || 'var(--muted)', flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>{a.agent_name}</span>
                            <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--border)', padding: '1px 6px', borderRadius: 8 }}>{a.agent_type}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', fontVariantNumeric: 'tabular-nums', color: 'var(--accent2)', fontWeight: 600 }}>{a.total_hits}</td>
                        <td style={{ padding: '8px 10px', fontVariantNumeric: 'tabular-nums' }}>{a.unique_pages}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontSize: 13, color: a.depth_ratio > 0.5 ? 'var(--green)' : a.depth_ratio > 0.2 ? 'var(--yellow)' : 'var(--muted)' }}>
                            {Math.round(a.depth_ratio * 100)}%
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>unique</span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontWeight: 700, color: TREND_COLOR[a.trend] || 'var(--muted)' }}>
                            {TREND_ICON[a.trend] || '→'} {a.trend}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--muted)', fontSize: 13, whiteSpace: 'nowrap' }}>
                          {a.last_seen ? new Date(a.last_seen).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--subtle)' }}>Depth ratio</strong> = unique pages / total visits. High ratio means the agent is exploring new content. Low ratio means it keeps revisiting the same pages.
              </div>
            </div>
          )}

          {/* Daily trend */}
          {summary.daily_trend?.length > 0 && (
            <div className="card flex col gap-14">
              <div style={{ fontWeight: 700, fontSize: 13 }}>Daily trend</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
                {(() => {
                  const maxVal = Math.max(...summary.daily_trend.map(d => d.hits), 1)
                  return summary.daily_trend.map(d => (
                    <div key={d.day} title={d.day + ': ' + d.hits + ' visits'} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', background: 'var(--accent2)', height: (d.hits / maxVal * 64) + 'px', borderRadius: '3px 3px 0 0', minHeight: 2, opacity: 0.75, transition: 'height 0.3s' }} />
                      <span style={{ fontSize: 9, color: 'var(--muted)', transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap' }}>{d.day.slice(5)}</span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Content Doctor ────────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = { high: ['#ef4444', '#ef444420'], medium: ['#f59e0b', '#f59e0b20'], low: ['var(--muted)', 'var(--border)'] }
  const [color, bg] = map[severity] || map.low
  return <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, padding: '2px 7px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>{severity}</span>
}

function ScoreGauge({ score, label, color }) {
  const c = color || (score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: c }}>{score}</div>
      <div style={{ height: 4, width: 80, borderRadius: 2, background: 'var(--border)' }}>
        <div style={{ height: 4, borderRadius: 2, background: c, width: score + '%', transition: 'width 0.5s' }} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>{label}</div>
    </div>
  )
}

function ContentDoctorPage() {
  const [mode, setMode] = useState('url')          // 'url' | 'paste'
  const [inputUrl, setInputUrl] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [analysisMode, setAnalysisMode] = useState('full') // 'full' | 'authority' | 'structure'
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [expandedGap, setExpandedGap] = useState(null)
  const [expandedIssue, setExpandedIssue] = useState(null)

  // Plan + domain fetching
  const [me, setMe] = useState(undefined) // undefined = still loading, null = no account
  const [domains, setDomains] = useState([])
  useEffect(() => {
    Promise.all([
      api.getMe().catch(() => null),
      api.getMyDomains().catch(() => ({ domains: [] })),
    ]).then(([meData, domainsData]) => {
      setMe(meData)
      setDomains(domainsData?.domains || [])
    })
  }, [])

  // Auto-populate URL from first registered domain
  useEffect(() => {
    if (domains.length > 0 && !inputUrl) {
      setInputUrl(`https://${domains[0]}`)
    }
  }, [domains])

  const plan = me?.plan || 'free'
  const isPaid = plan === 'starter' || plan === 'pro' || plan === 'enterprise'

  const run = async () => {
    setError(''); setResult(null); setLoading(true)
    try {
      let res
      if (mode === 'url') {
        if (!inputUrl.trim()) { setError('Enter a URL'); setLoading(false); return }
        res = await api.analyzeUrl(inputUrl.trim(), analysisMode)
      } else {
        if (pasteContent.trim().length < 100) { setError('Paste at least 100 characters of content'); setLoading(false); return }
        res = await api.analyzeContent(pasteContent.trim(), '')
      }
      setResult(res)
    } catch (e) {
      setError(e.message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const authority = result?.authority || (result?.authority_score !== undefined ? result : null)
  const structure = result?.structure || (result?.structure_score !== undefined ? result : null)

  // Still loading plan info — show spinner to avoid flicker
  if (me === undefined) return (
    <div className="flex col gap-24">
      <PageHeader title="Content Doctor" subtitle="Find the claims, structure, and gaps that stop AI from trusting and citing your content" />
      <div className="flex center gap-12" style={{ padding: 48, color: 'var(--muted)' }}>
        <span className="spinner" /> Loading…
      </div>
    </div>
  )

  return (
    <div className="flex col gap-24">
      <PageHeader
        title="Content Doctor"
        subtitle="Find the claims, structure, and gaps that stop AI from trusting and citing your content"
      />

      {/* Explainer — always shown to everyone */}
      {!result && (
        <TabExplainer
          icon="🩺"
          title="Content Doctor — find what's stopping AI from trusting your content"
          description="Paste a URL or your content and Galuli's AI runs two diagnostic modules: the Authority Gap Scanner finds claims AI won't trust, and the Structural Optimizer finds paragraphs too dense or ambiguous for LLMs to parse cleanly."
          features={[
            { icon: '🔍', label: 'Authority Gap Scanner', sub: 'Finds every unsupported claim, vague assertion, and missing citation AI flags as low-trust' },
            { icon: '🏗️', label: 'Structural Optimizer', sub: 'Spots dense paragraphs, buried key entities, and sections that need reformatting for AI parsing' },
            { icon: '📊', label: 'Content Health Score', sub: 'A single 0–100 score combining authority + structure — track it over time as you improve' },
            { icon: '✍️', label: 'Rewrite candidates', sub: 'Specific sentences flagged for rewriting with suggested fixes included' },
            { icon: '🎯', label: 'Top priorities', sub: 'The 3 highest-impact fixes ranked by how much they\'ll move your GEO score' },
            { icon: '⚡', label: 'Quick wins', sub: 'Low-effort improvements you can make in under 5 minutes' },
          ]}
        />
      )}

      {/* Paywall — free users */}
      {!isPaid && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10, color: 'var(--text)' }}>Content Doctor — Starter and above</div>
          <p style={{ color: 'var(--subtle)', fontSize: 14, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
            Finds every claim, paragraph, and assertion that AI won't trust — and gives you the specific rewrite. Not generic SEO advice. Actual fixes that make your content readable and citable by LLMs.
          </p>
          <a href="https://galuli.io/checkout/buy/8bc3ebee-b31d-43ee-bbcc-5b47ba3b0022" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: 14, padding: '10px 24px' }}>
            Upgrade to Starter — $9/mo →
          </a>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
            Free scan available on the <a href="/" style={{ color: 'var(--accent)' }}>homepage</a> · No credit card to try
          </div>
        </div>
      )}

      {/* Input panel — paid users only */}
      {isPaid && (
      <div className="card flex col gap-16">
        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
          {[['url', 'Analyze URL'], ['paste', 'Paste content']].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setResult(null); setError('') }}
              style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none',
                borderBottom: mode === m ? '2px solid var(--accent)' : '2px solid transparent',
                color: mode === m ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>

        {mode === 'url' && (
          <div className="flex col gap-12">
            <div>
              <label className="label">Page URL to analyze</label>
              {domains.length > 1 ? (
                <div className="flex gap-8">
                  <select value={inputUrl} onChange={e => setInputUrl(e.target.value)} style={{ flex: 1 }}>
                    {domains.map(d => <option key={d} value={`https://${d}`}>{d}</option>)}
                    <option value="">Enter custom URL…</option>
                  </select>
                  {inputUrl === '' && (
                    <input value={inputUrl} onChange={e => setInputUrl(e.target.value)}
                      placeholder="https://yoursite.com/blog/your-post"
                      onKeyDown={e => e.key === 'Enter' && run()}
                      style={{ flex: 2 }} />
                  )}
                </div>
              ) : (
                <input value={inputUrl} onChange={e => setInputUrl(e.target.value)}
                  placeholder="https://yoursite.com/blog/your-post"
                  onKeyDown={e => e.key === 'Enter' && run()} />
              )}
              {domains.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  ✓ Pre-filled from your registered domain — or type any page URL
                </div>
              )}
            </div>
            <div>
              <label className="label">Analysis type</label>
              <select value={analysisMode} onChange={e => setAnalysisMode(e.target.value)} style={{ width: 'auto' }}>
                <option value="full">Full diagnosis (authority + structure)</option>
                <option value="authority">Authority gaps only</option>
                <option value="structure">Structure optimization only</option>
              </select>
            </div>
          </div>
        )}

        {mode === 'paste' && (
          <div>
            <label className="label">Paste your page content (text or markdown)</label>
            <textarea value={pasteContent} onChange={e => setPasteContent(e.target.value)}
              placeholder="Paste the full text content of your page here..."
              style={{ width: '100%', minHeight: 160, padding: '12px 14px', borderRadius: 10, fontSize: 13,
                fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical',
                background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{pasteContent.length} chars (min 100)</div>
          </div>
        )}

        {error && (
          <div style={{ background: '#ef444415', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button className="btn btn-primary" onClick={run} disabled={loading} style={{ alignSelf: 'flex-start', padding: '11px 24px', fontWeight: 700 }}>
          {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analyzing…</> : '🩺 Run Content Doctor'}
        </button>
      </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Score hero */}
          <div className="card" style={{ padding: '24px 28px', borderTop: '3px solid var(--accent)' }}>
            <div className="flex center gap-32 wrap">
              {result.content_health_score !== undefined && (
                <ScoreGauge score={result.content_health_score} label={'Content Health\n' + result.grade} />
              )}
              {authority?.authority_score !== undefined && (
                <ScoreGauge score={authority.authority_score} label="Authority Score" color="var(--blue)" />
              )}
              {(result.information_gain_score != null || authority?.information_gain_score != null) && (
                <ScoreGauge score={result.information_gain_score != null ? result.information_gain_score : authority?.information_gain_score} label="Info Gain Score" color="var(--yellow)" />
              )}
              {structure?.structure_score !== undefined && (
                <ScoreGauge score={structure.structure_score} label="Structure Score" color="var(--green)" />
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                {result.top_priorities?.length > 0 && (
                  <div className="flex col gap-8">
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Top priorities</div>
                    {result.top_priorities.map((p, i) => (
                      <div key={i} className="flex gap-8" style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--subtle)' }}>
                        <span style={{ color: 'var(--accent2)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
                {result.quick_wins?.length > 0 && (
                  <div className="flex col gap-6" style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Quick wins (under 30 min)</div>
                    {result.quick_wins.map((w, i) => (
                      <div key={i} className="flex gap-8" style={{ fontSize: 13, lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>
                        <span style={{ color: 'var(--subtle)' }}>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Authority gaps */}
          {authority?.gaps?.length > 0 && (
            <div className="card flex col gap-14">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Authority Gaps</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Claims that AI systems won't trust because they lack empirical backing</div>
              </div>
              <div className="flex col gap-8">
                {authority.gaps.map((gap, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    <button onClick={() => setExpandedGap(expandedGap === i ? null : i)}
                      style={{ width: '100%', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', background: expandedGap === i ? 'var(--surface2)' : 'none', color: 'var(--text)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <SeverityBadge severity={gap.severity} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{gap.claim}</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{gap.type?.replace(/_/g, ' ')}</div>
                      </div>
                      <span style={{ color: 'var(--muted)', fontSize: 13, flexShrink: 0 }}>{expandedGap === i ? '▲' : '▼'}</span>
                    </button>
                    {expandedGap === i && (
                      <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {gap.suggestion && (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, marginTop: 12 }}>Suggestion</div>
                            <div style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6 }}>{gap.suggestion}</div>
                          </div>
                        )}
                        {gap.example_fix && (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Example rewrite</div>
                            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--accent2)', lineHeight: 1.6, fontStyle: 'italic' }}>{gap.example_fix}</div>
                          </div>
                        )}
                        {gap.ai_risk && (
                          <div style={{ background: '#ef444410', border: '1px solid #ef444430', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--muted)' }}>
                            <strong style={{ color: '#ef4444' }}>AI risk:</strong> {gap.ai_risk}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {authority.strengths?.length > 0 && (
                <div className="flex col gap-6" style={{ padding: '12px 14px', background: '#10b98110', borderRadius: 8, border: '1px solid #10b98130' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>What you're doing well</div>
                  {authority.strengths.map((s, i) => (
                    <div key={i} className="flex gap-8" style={{ fontSize: 13, color: 'var(--subtle)' }}>
                      <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Information Gain Issues */}
          {(result.information_gain_issues?.length > 0 || authority?.information_gain_issues?.length > 0) && (
            <div className="card flex col gap-14">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Information Gain Issues</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Generic content that AI already knows — add unique data, stats, or proprietary insights to get cited</div>
              </div>
              <div className="flex col gap-8">
                {(result.information_gain_issues || authority?.information_gain_issues || []).map((ig, i) => (
                  <div key={i} style={{ border: '1px solid var(--border2)', borderRadius: 8, padding: '12px 14px', background: 'var(--surface2)' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6, lineHeight: 1.5 }}>{ig.issue}</div>
                    {ig.fix && (
                      <div style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>Fix: </span>{ig.fix}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structural issues */}
          {structure?.issues?.length > 0 && (
            <div className="card flex col gap-14">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Structural Issues</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Formatting changes that would make this content more AI-readable</div>
              </div>
              <div className="flex col gap-8">
                {structure.issues.map((issue, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    <button onClick={() => setExpandedIssue(expandedIssue === i ? null : i)}
                      style={{ width: '100%', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', background: expandedIssue === i ? 'var(--surface2)' : 'none', color: 'var(--text)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <SeverityBadge severity={issue.severity} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{issue.description}</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{issue.type?.replace(/_/g, ' ')} {issue.location ? '· ' + issue.location : ''}</div>
                      </div>
                      <span style={{ color: 'var(--muted)', fontSize: 13, flexShrink: 0 }}>{expandedIssue === i ? '▲' : '▼'}</span>
                    </button>
                    {expandedIssue === i && (
                      <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                        {issue.fix && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>How to fix</div>
                            <div style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6 }}>{issue.fix}</div>
                          </div>
                        )}
                        {issue.example && (
                          <div style={{ marginTop: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--accent2)', lineHeight: 1.7, fontStyle: 'italic' }}>{issue.example}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Suggested new sections */}
              {structure.suggested_sections?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Sections to add</div>
                  <div className="flex col gap-6">
                    {structure.suggested_sections.map((s, i) => (
                      <div key={i} className="flex gap-10" style={{ fontSize: 13, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--accent2)', fontWeight: 700, flexShrink: 0 }}>+</span>
                        <span style={{ color: 'var(--subtle)', lineHeight: 1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key entities */}
              {structure.key_entities?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Key entities to define</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {structure.key_entities.map((e, i) => (
                      <div key={i} style={{ fontSize: 13, padding: '5px 12px', background: e.defined ? '#10b98115' : '#f59e0b15', border: '1px solid ' + (e.defined ? '#10b98130' : '#f59e0b30'), borderRadius: 20, color: e.defined ? 'var(--green)' : 'var(--yellow)' }}>
                        {e.defined ? '✓' : '!'} {e.entity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rewrite candidates */}
          {structure?.rewrite_candidates?.length > 0 && (
            <div className="card flex col gap-14">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Rewrite Candidates</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Dense paragraphs that would perform better in a different format</div>
              </div>
              {structure.rewrite_candidates.map((r, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="flex between center">
                    <span style={{ fontSize: 13, fontWeight: 700, background: 'var(--accent2)22', color: 'var(--accent2)', padding: '3px 9px', borderRadius: 10 }}>
                      Convert to: {r.format?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.6, borderLeft: '3px solid var(--border)', paddingLeft: 12 }}>"{r.original}"</div>
                  {r.reason && <div style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.5 }}>{r.reason}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Snippet ───────────────────────────────────────────────────────────────────
function SnippetPage() {
  const [tenants, setTenants] = useState([])
  const [selectedKey, setSelectedKey] = useState(localStorage.getItem('galuli_api_key') || '')
  const [domains, setDomains] = useState([])
  const [creatingTenant, setCreatingTenant] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', email: '' })

  useEffect(() => {
    api.listTenants().then(r => {
      const list = r.tenants || []
      setTenants(list)
      // Auto-select first key if none set
      if (!selectedKey && list.length > 0) setSelectedKey(list[0].api_key)
    }).catch(() => { })
  }, [])

  useEffect(() => {
    if (!selectedKey) return
    // Fetch domains for the currently selected key
    fetch(`${api.base()}/api/v1/tenants/domains`, {
      headers: { 'X-API-Key': selectedKey, 'Content-Type': 'application/json' },
    }).then(r => r.ok ? r.json() : { domains: [] })
      .then(d => setDomains(d.domains || []))
      .catch(() => setDomains([]))
  }, [selectedKey])

  const handleCreateTenant = async (e) => {
    e.preventDefault()
    setCreatingTenant(true)
    try {
      const res = await api.createTenant(newForm.name, newForm.email, 'free')
      toast.success('Key created!')
      setSelectedKey(res.api_key)
      localStorage.setItem('galuli_api_key', res.api_key)
      setNewForm({ name: '', email: '' })
      const r = await api.listTenants()
      setTenants(r.tenants || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreatingTenant(false)
    }
  }

  const activeKey = selectedKey || 'YOUR_KEY'
  const snippetTag = `<script src="${api.base()}/galuli.js?key=${activeKey}" async></script>`
  const debugTag = `<script src="${api.base()}/galuli.js?key=${activeKey}&debug=1" async></script>`

  return (
    <div className="flex col gap-20" style={{ maxWidth: 860 }}>
      <PageHeader
        title="Install the Snippet"
        subtitle="One script tag. Your site becomes AI-readable, WebMCP-compliant, and fully tracked."
      />

      <TabExplainer
        icon="⬡"
        title="One script tag activates the entire Galuli stack"
        description="Paste the snippet into your site's &lt;head&gt; and everything below activates automatically — no configuration needed. Works on any stack: WordPress, Webflow, Shopify, React, Next.js, plain HTML."
        features={[
          { icon: '📡', label: 'Live AI agent tracking', sub: 'Detects 30+ crawlers — GPTBot, ClaudeBot, PerplexityBot, Gemini and more' },
          { icon: '⬡', label: 'WebMCP tool registration', sub: 'Your forms become AI-callable tools for agent workflows (W3C 2026 standard)' },
          { icon: '📄', label: 'llms.txt auto-generated', sub: 'Machine-readable site summary served at /llms.txt — AI crawlers fetch this first' },
          { icon: '🔗', label: 'Discovery tags injected', sub: 'ai-plugin.json link + registry URL added to your <head> automatically' },
          { icon: '📊', label: 'Schema.org markup', sub: 'Auto-injected if missing — boosts Gemini and Google AI citation rate' },
          { icon: '♻️', label: 'Smart re-indexing', sub: 'Only re-crawls when your content actually changes — efficient and automatic' },
        ]}
      />

      {/* ── Step 1: Get your key ── */}
      <div className="card flex col gap-16">
        <div style={{ fontWeight: 700, fontSize: 13 }}>Step 1 — Your API key</div>

        {tenants.length > 0 ? (
          <>
            <div>
              <label className="label">Select key</label>
              <select value={selectedKey} onChange={e => { setSelectedKey(e.target.value); localStorage.setItem('galuli_api_key', e.target.value) }}>
                {tenants.map(t => (
                  <option key={t.api_key} value={t.api_key}>{t.email} — {t.plan} plan</option>
                ))}
              </select>
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: 'var(--accent2)', wordBreak: 'break-all', position: 'relative' }}>
              {selectedKey}
              <div style={{ position: 'absolute', top: 6, right: 8 }}><CopyBtn text={selectedKey} label="Copy key" /></div>
            </div>
            {/* Registered domains */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
                Domains using this key {domains.length > 0 ? `(${domains.length})` : '— none yet'}
              </div>
              {domains.length > 0 ? (
                <div className="flex col gap-4">
                  {domains.map(d => (
                    <div key={d} className="flex center gap-8" style={{ fontSize: 13, padding: '5px 10px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <span className="dot dot-green" style={{ width: 6, height: 6 }} />
                      <span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{d}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Domains register automatically the first time the snippet runs on that site.
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              You need an API key to activate the snippet. Create one below — it's free.
            </div>
            <form onSubmit={handleCreateTenant} className="flex col gap-12">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Your name</label>
                  <input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" required />
                </div>
              </div>
              <button className="btn btn-primary" disabled={creatingTenant} style={{ alignSelf: 'flex-start' }}>
                {creatingTenant ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</> : 'Create free API key →'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* ── Step 2: Add snippet ── */}
      <div className="card flex col gap-14">
        <div style={{ fontWeight: 700, fontSize: 13 }}>Step 2 — Add to your site's <code>&lt;head&gt;</code></div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Works on WordPress, Webflow, Shopify, custom HTML, React — anything.</div>
        <div className="code-block">
          {snippetTag}
          <div className="copy-btn-abs"><CopyBtn text={snippetTag} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['WordPress: paste in Appearance → Theme Editor → header.php',
            'Webflow: Project Settings → Custom Code → Head Code',
            'Shopify: theme.liquid before </head>',
          ].map(s => (
            <span key={s} style={{ fontSize: 13, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'var(--muted)' }}>{s}</span>
          ))}
        </div>
      </div>

      {/* ── Step 3: Done ── */}
      <div className="card flex col gap-12" style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>Step 3 — Done. Here's what activates automatically:</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          {[
            { icon: '📡', title: 'AI agent tracking', desc: '30+ crawlers detected in real time' },
            { icon: '⬡', title: 'WebMCP tools', desc: 'Forms registered as AI-callable tools' },
            { icon: '📄', title: 'llms.txt generated', desc: 'Machine-readable at /llms.txt' },
            { icon: '🔗', title: 'Discovery links', desc: 'Injected into your <head>' },
            { icon: '📊', title: 'Schema.org markup', desc: 'Auto-injected if missing' },
            { icon: '♻️', title: 'Smart re-indexing', desc: 'Only when content actually changes' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Debug + verify (collapsed) ── */}
      <div className="card flex col gap-12">
        <div style={{ fontWeight: 600, fontSize: 13 }}>Debug mode</div>
        <div className="code-block">
          {debugTag}
          <div className="copy-btn-abs"><CopyBtn text={debugTag} /></div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Add <code>debug=1</code> to see detailed logs in your browser console.</div>
      </div>
    </div>
  )
}

// ── Registries ────────────────────────────────────────────────────────────────
function RegistriesPage() {
  const [registries, setRegistries] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [tab, setTab] = useState('overview')
  const [llmsTxt, setLlmsTxt] = useState('')

  const load = useCallback(() => {
    api.listRegistries().then(r => setRegistries(r.registries || [])).catch(() => { })
  }, [])
  useEffect(() => { load() }, [load])

  const select = async (domain) => {
    setSelected(domain); setDetail(null); setLlmsTxt(''); setTab('overview')
    try { setDetail(await api.getRegistry(domain)) } catch (err) { toast.error(err.message) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, height: 'calc(100vh - 54px - 48px)' }}>
      {/* Sidebar */}
      <div className="card flex col gap-4" style={{ overflow: 'auto', padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', padding: '4px 8px 4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          {registries.length} site{registries.length !== 1 ? 's' : ''}
        </div>
        {registries.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 13, padding: '8px 8px 4px', lineHeight: 1.6 }}>No registries yet.<br />Index a site first.</div>
        )}
        {registries.map(r => (
          <button key={r.domain} onClick={() => select(r.domain)} style={{
            background: selected === r.domain ? 'var(--border)' : 'none',
            color: selected === r.domain ? 'var(--text)' : 'var(--muted)',
            padding: '8px 10px', borderRadius: 8, textAlign: 'left', width: '100%',
            fontSize: 13, fontFamily: 'monospace', transition: 'all 0.12s',
          }}>{r.domain}</button>
        ))}
      </div>

      {/* Detail */}
      <div style={{ overflow: 'auto' }}>
        {!selected && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', flexDirection: 'column', gap: 14, padding: 40 }}>
            <div style={{ fontSize: 13, opacity: 0.3 }}>▦</div>
            <div style={{ fontSize: 13, textAlign: 'center' }}>Select a domain from the list</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', maxWidth: 340, lineHeight: 1.7 }}>
              A <strong style={{ color: 'var(--subtle)' }}>registry</strong> is Galuli's structured representation of your site — capabilities, pricing, integrations, and WebMCP tools — served as JSON, llms.txt, and an AI plugin manifest that AI systems can read directly.
            </div>
          </div>
        )}
        {selected && !detail && (
          <div className="flex center gap-12" style={{ padding: 40, color: 'var(--muted)' }}>
            <span className="spinner" /> Loading…
          </div>
        )}
        {detail && (
          <div className="flex col gap-12">
            {/* Header */}
            <div className="card flex center between gap-16 wrap" style={{ padding: '16px 20px' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{detail.metadata.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3, maxWidth: 500 }}>{detail.metadata.description}</div>
              </div>
              <div className="flex gap-8 center wrap">
                <ConfBar score={detail.ai_metadata.confidence_score} />
                <button className="btn btn-ghost btn-sm" onClick={() => api.refreshRegistry(selected).then(() => toast.info('Re-crawl queued')).catch(e => toast.error(e.message))}>
                  ↻ Refresh
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => {
                  if (confirm(`Delete registry for ${selected}?`))
                    api.deleteRegistry(selected).then(() => { toast.success(`Deleted ${selected}`); setSelected(null); setDetail(null); load() }).catch(e => toast.error(e.message))
                }}>
                  Delete
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 0 }}>
              {['overview', 'capabilities', 'pricing', 'integration', 'llms.txt', 'raw json'].map(t => (
                <button key={t} className={`tab ${tab === t ? 'active' : ''}`}
                  onClick={() => { setTab(t); if (t === 'llms.txt' && !llmsTxt) api.getLlmsTxt(selected).then(setLlmsTxt) }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="card flex col gap-10">
                  <div className="label">Service info</div>
                  {[['Domain', detail.domain], ['Category', detail.metadata.category], ['Industry', detail.metadata.sub_categories?.join(', ')], ['Founded', detail.metadata.founded_year], ['HQ', detail.metadata.headquarters], ['Size', detail.metadata.company_size]].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="info-row">
                      <span className="info-row-label">{k}</span>
                      <span className="info-row-value" style={{ fontSize: 13 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="card flex col gap-10">
                  <div className="label">WebMCP status</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 4 }}>
                    WebMCP (W3C, Chrome 2026) lets AI agents call your site's forms and actions directly. Requires the Galuli snippet.
                  </div>
                  <div className="flex between center">
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>Status</span>
                    <span className={`badge ${detail.ai_metadata.webmcp_enabled ? 'badge-green' : 'badge-gray'}`}>
                      {detail.ai_metadata.webmcp_enabled ? '✓ Active' : '○ Snippet not installed'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-row-label">Tools registered</span>
                    <span className="info-row-value" style={{ fontSize: 13 }}>{detail.ai_metadata.webmcp_tools_count || 0}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-row-label">Forms exposed</span>
                    <span className="info-row-value" style={{ fontSize: 13 }}>{detail.ai_metadata.forms_exposed || 0}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-row-label">Last updated</span>
                    <span className="info-row-value" style={{ fontSize: 13 }}>{new Date(detail.last_updated).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="card flex col gap-10" style={{ gridColumn: '1/-1' }}>
                  <div className="label">Machine-readable endpoints</div>
                  {[['JSON registry', detail.ai_metadata.registry_url], ['llms.txt', detail.ai_metadata.llms_txt_url], ['AI Plugin manifest', detail.ai_metadata.ai_plugin_url]].map(([label, url]) => (
                    <div key={label} className="info-row">
                      <span className="info-row-label">{label}</span>
                      <div className="flex center gap-8">
                        <code style={{ fontSize: 13 }}>{url}</code>
                        <CopyBtn text={url} />
                        <a href={url} target="_blank" style={{ fontSize: 13 }}>↗</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'capabilities' && (
              <div className="flex col gap-10">
                {detail.capabilities.length === 0
                  ? <div className="card" style={{ color: 'var(--muted)', fontSize: 13, padding: 24 }}>No capabilities extracted.</div>
                  : detail.capabilities.map(cap => (
                    <div key={cap.id} className="card capability">
                      <div className="flex between center wrap gap-8" style={{ marginBottom: cap.description ? 8 : 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{cap.name}</div>
                        <span className="badge badge-blue">{cap.category}</span>
                      </div>
                      {cap.description && <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>{cap.description}</div>}
                      {cap.use_cases?.length > 0 && (
                        <div className="flex wrap gap-6">
                          {cap.use_cases.map(u => <span key={u} style={{ fontSize: 13, color: 'var(--subtle)', background: 'var(--border)', padding: '2px 8px', borderRadius: 4 }}>{u}</span>)}
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            )}

            {tab === 'pricing' && (
              <div className="card flex col gap-14">
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[['Model', detail.pricing.model], ['Free tier', detail.pricing.has_free_tier ? 'Yes' : 'No'], ['Contact sales', detail.pricing.contact_sales_required ? 'Required' : 'Not required']].map(([k, v]) => (
                    <div key={k}><div className="label">{k}</div><div style={{ fontWeight: 600 }}>{v}</div></div>
                  ))}
                </div>
                {detail.pricing.tiers?.length > 0 && (
                  <table className="table">
                    <thead><tr><th>Plan</th><th>Price</th><th>Unit</th><th>Notes</th></tr></thead>
                    <tbody>{detail.pricing.tiers.map((t, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>{t.contact_sales ? 'Contact sales' : t.price_per_unit != null ? `${t.currency} ${t.price_per_unit}` : '—'}</td>
                        <td style={{ color: 'var(--muted)' }}>{t.unit || '—'}</td>
                        <td style={{ color: 'var(--muted)', fontSize: 13 }}>{t.description || ''}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            )}

            {tab === 'integration' && (
              <div className="card flex col gap-12">
                {[['Base URL', detail.integration.api_base_url], ['Version', detail.integration.api_version], ['Auth methods', detail.integration.auth_methods?.join(', ')], ['Webhooks', detail.integration.webhooks_supported ? 'Supported' : 'Not documented']].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="info-row">
                    <span className="info-row-label">{k}</span>
                    <code style={{ fontSize: 13 }}>{v}</code>
                  </div>
                ))}
              </div>
            )}

            {tab === 'llms.txt' && (
              <div className="card flex col gap-12">
                <div className="flex between center">
                  <div style={{ fontWeight: 600, fontSize: 13 }}>llms.txt</div>
                  <CopyBtn text={llmsTxt} />
                </div>
                {!llmsTxt && <div className="flex center gap-8"><span className="spinner" /><span style={{ color: 'var(--muted)' }}>Loading…</span></div>}
                {llmsTxt && <pre>{llmsTxt}</pre>}
              </div>
            )}

            {tab === 'raw json' && (
              <div className="card flex col gap-12">
                <div className="flex between center">
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Raw JSON</div>
                  <CopyBtn text={JSON.stringify(detail, null, 2)} />
                </div>
                <pre>{JSON.stringify(detail, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ConfBar({ score }) {
  const pct = Math.round((score || 0) * 100)
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div className="flex center gap-8" style={{ fontSize: 13, color: 'var(--muted)' }}>
      <div className="conf-bar"><div className="conf-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <span style={{ color }}>{pct}% confidence</span>
    </div>
  )
}

// ── Tenants ───────────────────────────────────────────────────────────────────
function TenantsPage() {
  const [tenants, setTenants] = useState([])
  const [form, setForm] = useState({ name: '', email: '', plan: 'free' })
  const [loading, setLoading] = useState(false)
  const [newKey, setNewKey] = useState(null)

  const load = useCallback(() => {
    api.listTenants().then(r => setTenants(r.tenants || [])).catch(() => { })
  }, [])
  useEffect(() => { load() }, [load])

  const create = async (e) => {
    e.preventDefault(); setLoading(true); setNewKey(null)
    try {
      const res = await api.createTenant(form.name, form.email, form.plan)
      setNewKey(res.api_key)
      toast.success(`Tenant created: ${form.email}`)
      setForm({ name: '', email: '', plan: 'free' })
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const planBadge = { enterprise: 'badge-blue', pro: 'badge-green', free: 'badge-gray' }

  return (
    <div className="flex col gap-24">
      <PageHeader title="Tenants" subtitle="Manage API keys and plans for your users." />

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Create form */}
        <div className="card flex col gap-16">
          <div style={{ fontWeight: 700, fontSize: 13 }}>Create new tenant</div>
          <form onSubmit={create} className="flex col gap-14">
            <div>
              <label className="label">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@acme.com" required />
            </div>
            <div>
              <label className="label">Plan</label>
              <select value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="free">Free — 3 sites, 10 req/min</option>
                <option value="pro">Pro — 50 sites, 60 req/min</option>
                <option value="enterprise">Enterprise — unlimited</option>
              </select>
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</> : 'Create tenant'}
            </button>
          </form>

          {newKey && (
            <div style={{ background: '#10b98110', border: '1px solid #10b98130', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, marginBottom: 8 }}>
                ✓ API key — save this now, it won't be shown again
              </div>
              <code style={{ fontSize: 13, wordBreak: 'break-all', display: 'block', marginBottom: 8 }}>{newKey}</code>
              <CopyBtn text={newKey} label="Copy key" />
            </div>
          )}
        </div>

        {/* Tenant list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Plan</th>
                <th>Sites</th>
                <th>Requests</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No tenants yet</td></tr>
              )}
              {tenants.map(t => (
                <tr key={t.api_key}>
                  <td style={{ fontWeight: 500 }}>{t.email}</td>
                  <td style={{ color: 'var(--muted)' }}>{t.name}</td>
                  <td><span className={`badge ${planBadge[t.plan] || 'badge-gray'}`}>{t.plan}</span></td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{t.domains_limit}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{t.requests_total}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{t.last_seen ? new Date(t.last_seen).toLocaleDateString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Lemon Squeezy checkout URLs ───────────────────────────────────────────────
// Annual URLs — replace TODOs once you have the annual checkout links from LS
const LS_URLS = {
  starter:        'https://galuli.io/checkout/buy/8bc3ebee-b31d-43ee-bbcc-5b47ba3b0022',
  starter_annual: null, // TODO: paste Starter $90/yr checkout URL here
  pro:            'https://galuli.io/checkout/buy/e280dc25-998e-4ca5-b224-5d6548d8f4e0',
  pro_annual:     null, // TODO: paste Pro $290/yr checkout URL here
}
function openCheckout(plan, email) {
  const base = LS_URLS[plan]
  if (!base) return
  const url = email ? `${base}?checkout[email]=${encodeURIComponent(email)}` : base
  window.open(url, '_blank', 'noopener')
}

// ── Upgrade CTAs (needs own component for useState hook) ──────────────────────
function UpgradeCTAs({ plan, email }) {
  const [billing, setBilling] = useState('monthly')
  const isAnnual = billing === 'annual'
  if (plan !== 'free' && plan !== 'starter') return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Monthly / Annual toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
          {['monthly', 'annual'].map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: billing === b ? 'var(--accent)' : 'none',
              color: billing === b ? 'white' : 'var(--muted)',
              border: 'none', transition: 'all 0.15s',
            }}>{b.charAt(0).toUpperCase() + b.slice(1)}</button>
          ))}
        </div>
        {isAnnual && <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>Save ~16% 🎉</span>}
      </div>

      {/* Starter card — only for free plan */}
      {plan === 'free' && (
        <div style={{ background: 'linear-gradient(135deg, var(--accent)12, var(--accent2)12)', border: '1px solid var(--accent)30', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
              Starter — {isAnnual ? '$90/yr' : '$9/mo'}
              {isAnnual && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>2 months free</span>}
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>10 sites · AI traffic tracking · GEO score · Content Doctor</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openCheckout(isAnnual ? 'starter_annual' : 'starter', email)}>
            Upgrade to Starter →
          </button>
        </div>
      )}

      {/* Pro card */}
      <div style={{ background: 'linear-gradient(135deg, var(--purple)10, var(--accent)10)', border: '1px solid var(--purple)30', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
            Pro — {isAnnual ? '$290/yr' : '$29/mo'}
            {isAnnual && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>2 months free</span>}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Unlimited sites · priority crawls · full API access · advanced analytics</div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ background: 'var(--purple)' }} onClick={() => openCheckout(isAnnual ? 'pro_annual' : 'pro', email)}>
          Upgrade to Pro →
        </button>
      </div>
    </div>
  )
}

// ── Settings (Profile & Billing) ──────────────────────────────────────────────
function SettingsPage({ setPage }) {
  const [me, setMe] = useState(null)
  const [usage, setUsage] = useState(null)
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [showKey, setShowKey] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('galuli_api_url') || '')
  const [savedUrl, setSavedUrl] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.getMe().catch(() => null),
      api.getMyUsage().catch(() => null),
      api.getMyDomains().catch(() => ({ domains: [] })),
    ]).then(([meData, usageData, domainsData]) => {
      setMe(meData)
      setUsage(usageData)
      setDomains(domainsData?.domains || [])
    }).finally(() => setLoading(false))
  }, [])

  const activeKey = localStorage.getItem('galuli_api_key') || ''

  const PLAN_DETAILS = {
    free:       { label: 'Free',       color: 'var(--muted)',   price: '$0/mo',   sites: '3 sites',       rate: '10 req/min' },
    starter:    { label: 'Starter',    color: 'var(--green)',   price: '$9/mo',   sites: '10 sites',      rate: '30 req/min' },
    pro:        { label: 'Pro',        color: 'var(--accent2)', price: '$29/mo',  sites: 'Unlimited',     rate: '120 req/min' },
    enterprise: { label: 'Enterprise', color: 'var(--blue)',    price: 'Custom',  sites: 'Unlimited',     rate: '300 req/min' },
  }

  const plan = me?.plan || 'free'
  const pd = PLAN_DETAILS[plan] || PLAN_DETAILS.free
  const domainsUsed = domains.length
  const domainsLimit = me?.domains_limit || 3
  const domainPct = Math.min(100, Math.round((domainsUsed / domainsLimit) * 100))

  if (loading) return (
    <div className="flex center gap-12" style={{ padding: 32, color: 'var(--muted)' }}>
      <span className="spinner" /> Loading profile…
    </div>
  )

  // ── Danger Zone card (always visible) ──
  const DangerZone = () => (
    <div className="card flex col gap-14" style={{ border: '1px solid #ef444430' }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--red)' }}>⚠️ Danger Zone</div>
      <div className="flex between center wrap gap-12" style={{ background: 'var(--surface2)', border: '1px solid #ef444420', borderRadius: 10, padding: '14px 16px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>Wipe all data</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Delete every registry, scan, and job from the database. Cannot be undone.</div>
        </div>
        <button
          className="btn btn-danger btn-sm"
          onClick={async () => {
            if (!confirm('Delete ALL registries, scans, and jobs?\n\nThis wipes the entire database and cannot be undone.')) return
            try {
              await api.wipeAll()
              toast.success('All data wiped — refresh to see an empty dashboard')
            } catch (err) {
              toast.error(err.message)
            }
          }}
        >
          Wipe all data →
        </button>
      </div>
    </div>
  )

  // No tenant key — show explainer + sign-up prompt
  if (!me && !activeKey) {
    return (
      <div className="flex col gap-20" style={{ maxWidth: 720 }}>
        <PageHeader title="Profile & Billing" subtitle="Manage your account, plan, and billing." />
        <TabExplainer
          icon="⚙️"
          title="Settings — your plan, API key, and billing in one place"
          description="Once you create a free account in the Snippet tab, your profile appears here. You can upgrade your plan, see usage, manage domains, and copy your API key."
          features={[
            { icon: '📋', label: 'Plan & usage', sub: 'Sites used vs. limit, requests this month, plan details' },
            { icon: '🔑', label: 'API key', sub: 'Copy your key for the snippet, direct API calls, or integrations' },
            { icon: '🌐', label: 'Registered domains', sub: 'All sites sending data — with status and last-seen info' },
            { icon: '💳', label: 'Billing', sub: 'Starter $9/mo · Pro $29/mo — powered by Lemon Squeezy' },
          ]}
          cta={true}
          onCta={() => setPage('snippet')}
          ctaLabel="Create free account in Snippet tab →"
        />
        <DangerZone />
      </div>
    )
  }

  return (
    <div className="flex col gap-20" style={{ maxWidth: 720 }}>
      <PageHeader title="Profile & Billing" subtitle="Your account, plan, and usage." />

      {/* ── Profile card ── */}
      {me && (
        <div className="card flex col gap-14">
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Account</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>Name</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{me.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>Email</div>
              <div style={{ fontSize: 13 }}>{me.email}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>Member since</div>
              <div style={{ fontSize: 13, color: 'var(--subtle)' }}>{new Date(me.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>Last active</div>
              <div style={{ fontSize: 13, color: 'var(--subtle)' }}>{me.last_seen ? new Date(me.last_seen).toLocaleDateString() : 'Just now'}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Plan card ── */}
      <div className="card flex col gap-16">
        <div className="flex between center">
          <div style={{ fontWeight: 700, fontSize: 13 }}>Current plan</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: pd.color, background: 'var(--surface2)', border: `1px solid ${pd.color}40`, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.4px' }}>{pd.label}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Sites', value: pd.sites },
            { label: 'Rate limit', value: pd.rate },
            { label: 'Price', value: pd.price },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Usage bar */}
        <div>
          <div className="flex between" style={{ fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--muted)' }}>Sites used</span>
            <span style={{ fontWeight: 600, color: domainPct >= 80 ? 'var(--yellow)' : 'var(--subtle)' }}>
              {domainsUsed} / {domainsLimit}
            </span>
          </div>
          <div style={{ background: 'var(--border)', borderRadius: 4, height: 7 }}>
            <div style={{
              height: 7, borderRadius: 4,
              background: domainPct >= 90 ? 'var(--red)' : domainPct >= 70 ? 'var(--yellow)' : 'var(--green)',
              width: `${domainPct}%`, transition: 'width 0.4s',
            }} />
          </div>
          {domainsUsed > 0 && (
            <div className="flex wrap gap-4" style={{ marginTop: 8 }}>
              {domains.map(d => (
                <span key={d} style={{ fontSize: 13, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 8px', color: 'var(--subtle)', fontFamily: 'monospace' }}>{d}</span>
              ))}
            </div>
          )}
        </div>

        {/* Upgrade CTAs */}
        <UpgradeCTAs plan={plan} email={me?.email} />
        {plan === 'pro' && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>Need more? Enterprise</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Unlimited sites · 300 req/min · dedicated support · SLA</div>
            </div>
            <a href="mailto:hello@galuli.io?subject=Enterprise plan" className="btn btn-ghost btn-sm">Contact us →</a>
          </div>
        )}
      </div>

      {/* ── Usage stats ── */}
      {me && (
        <div className="card flex col gap-12">
          <div style={{ fontWeight: 700, fontSize: 13 }}>Usage</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            {[
              { label: 'Total requests', value: me.requests_total ?? 0 },
              { label: 'Today', value: me.requests_today ?? 0 },
              { label: 'Rate limit', value: `${me.rate_limit_per_min}/min` },
            ].map(({ label, value }) => (
              <div key={label} className="stat-card">
                <div className="stat-value" style={{ fontSize: 13, color: 'var(--accent2)' }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          {usage?.usage?.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Recent activity</div>
              <div className="flex col gap-4">
                {usage.usage.slice(0, 6).map((u, i) => (
                  <div key={i} className="flex between center" style={{ fontSize: 13, padding: '5px 10px', background: 'var(--surface2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--subtle)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{u.endpoint}</span>
                    <div className="flex center gap-8">
                      {u.domain && <span style={{ color: 'var(--muted)' }}>{u.domain}</span>}
                      <span style={{ color: u.status_code < 300 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{u.status_code}</span>
                      <span style={{ color: 'var(--muted)' }}>{new Date(u.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Billing ── */}
      <div className="card flex col gap-14">
        <div style={{ fontWeight: 700, fontSize: 13 }}>Billing</div>
        {(plan === 'free') ? (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 13 }}>🆓</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>Free plan</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>No payment method on file. Upgrade above to unlock more sites and features.</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => openCheckout('starter', me?.email)}>Upgrade to Starter →</button>
          </div>
        ) : (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 13 }}>🍋</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>Managed by Lemon Squeezy</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Your subscription, invoices, and payment method are managed securely via Lemon Squeezy.</div>
            </div>
            <a
              href="https://app.lemonsqueezy.com/my-orders"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              Manage billing →
            </a>
          </div>
        )}
      </div>

      {/* ── API key (secondary, collapsible) ── */}
      <div className="card flex col gap-10">
        <button
          onClick={() => setShowKey(v => !v)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', color: 'var(--text)', padding: 0, fontSize: 13, fontWeight: 700 }}
        >
          <span>API Key</span>
          <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>{showKey ? '▲ hide' : '▼ show'}</span>
        </button>
        {showKey && (
          <div className="flex col gap-8" style={{ marginTop: 4 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
              Your API key is needed to activate the snippet and authenticate requests. Keep it secret.
            </div>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: 'var(--accent2)', wordBreak: 'break-all', position: 'relative' }}>
              {activeKey || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No key set — create one in the Snippet tab</span>}
              {activeKey && <div style={{ position: 'absolute', top: 6, right: 8 }}><CopyBtn text={activeKey} label="Copy" /></div>}
            </div>
          </div>
        )}
      </div>

      {/* ── Advanced (developer) ── */}
      <div className="card flex col gap-10">
        <button
          onClick={() => setShowAdvanced(v => !v)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', color: 'var(--text)', padding: 0, fontSize: 13, fontWeight: 700 }}
        >
          <span>Advanced</span>
          <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>{showAdvanced ? '▲ hide' : '▼ show'}</span>
        </button>
        {showAdvanced && (
          <div className="flex col gap-12" style={{ marginTop: 4 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              Override the API endpoint — only needed if you're self-hosting Galuli.
            </div>
            <div>
              <label className="label">Custom API URL</label>
              <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder={api.base()} />
            </div>
            <div className="flex gap-10">
              <button className="btn btn-primary btn-sm" onClick={() => {
                if (apiUrl) localStorage.setItem('galuli_api_url', apiUrl)
                else localStorage.removeItem('galuli_api_url')
                setSavedUrl(true); setTimeout(() => setSavedUrl(false), 2000)
                toast.success('Saved')
              }}>
                {savedUrl ? '✓ Saved' : 'Save URL'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                localStorage.removeItem('galuli_api_url')
                setApiUrl('')
                toast.info('Reset to default')
              }}>
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      <DangerZone />
    </div>
  )
}

// ── GEO Score ─────────────────────────────────────────────────────────────────
const GEO_LLM_META = {
  chatgpt: { name: 'ChatGPT', company: 'OpenAI', emoji: '🟢', color: '#10b981' },
  perplexity: { name: 'Perplexity', company: 'Perplexity', emoji: '🔵', color: '#3b82f6' },
  claude: { name: 'Claude', company: 'Anthropic', emoji: '🟠', color: '#f59e0b' },
  gemini: { name: 'Gemini', company: 'Google', emoji: '🟣', color: '#8b5cf6' },
  grok: { name: 'Grok', company: 'xAI', emoji: '🩵', color: '#06b6d4' },
  llama: { name: 'Llama', company: 'Meta', emoji: '🔴', color: '#ef4444' },
}

function GeoPage() {
  const [registries, setRegistries] = useState([])
  const [selected, setSelected] = useState('')
  const [geo, setGeo] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadGeo = (domain) => {
    setSelected(domain); setLoading(true); setGeo(null)
    api.getGeoScore(domain).then(setGeo).catch(() => { }).finally(() => setLoading(false))
  }

  useEffect(() => {
    api.listRegistries().then(r => {
      const regs = r.registries || []
      setRegistries(regs)
      if (regs.length > 0) loadGeo(regs[0].domain)
    }).catch(() => { })
  }, [])

  const gradeColor = (score) => score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--blue)' : score >= 40 ? 'var(--yellow)' : 'var(--red)'
  const statusBadge = (status) => {
    if (status === 'good') return { bg: '#10b98120', color: '#10b981', label: 'Good' }
    if (status === 'needs_work') return { bg: '#f59e0b20', color: '#f59e0b', label: 'Needs work' }
    return { bg: '#ef444420', color: '#ef4444', label: 'Missing' }
  }

  return (
    <div className="flex col gap-24">
      <div className="flex between center wrap gap-12">
        <PageHeader
          title="GEO Score"
          subtitle="How likely each major AI is to cite and recommend your site"
        />
        {registries.length > 0 && (
          <select value={selected} onChange={e => loadGeo(e.target.value)} style={{ width: 'auto', minWidth: 200 }}>
            {registries.map(r => <option key={r.domain} value={r.domain}>{r.domain}</option>)}
          </select>
        )}
      </div>

      {registries.length === 0 && !loading && (
        <TabExplainer
          icon="🌐"
          title="GEO Score — how likely each AI is to cite and recommend your site"
          description="GEO (Generative Engine Optimization) measures your site's citation readiness across 6 major AI systems. Each scores you 0–20 based on what that specific AI values — freshness, structured data, authority signals, or content depth. Scan a site from Overview to see your scores."
          features={[
            { icon: '🟢', label: 'ChatGPT / GPT-4o', sub: 'Values encyclopedic content, detailed use cases, clear pricing, docs URL' },
            { icon: '🔵', label: 'Perplexity AI', sub: 'Values freshness, authority links, page coverage, pricing page' },
            { icon: '🟠', label: 'Claude (Anthropic)', sub: 'Values clarity, problems-solved, constraints documented, specific category' },
            { icon: '🟣', label: 'Gemini (Google)', sub: 'Values Schema.org markup, OpenAPI spec, SDKs, structured pricing tiers' },
            { icon: '🩵', label: 'Grok (xAI)', sub: 'Values recency, topical breadth, page coverage, capability count' },
            { icon: '🔴', label: 'Llama (Meta)', sub: 'Values registry completeness, confidence score, broad page indexing' },
          ]}
        />
      )}

      {loading && (
        <div className="flex center gap-12" style={{ padding: 40, color: 'var(--muted)' }}>
          <span className="spinner" /> Calculating GEO score…
        </div>
      )}

      {!loading && geo && (
        <>
          {/* Hero */}
          <div className="card" style={{ padding: '28px 32px' }}>
            <div className="flex center gap-32 wrap">
              <ScoreRing score={geo.geo_total} size={130} />
              <div className="flex col gap-10" style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px' }}>{geo.geo_label}</div>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>{selected}</div>
                <div className="flex gap-8 wrap" style={{ marginTop: 4 }}>
                  <span className="badge badge-blue">GEO: {geo.geo_total}/100</span>
                  <span className={`badge ${geo.geo_total >= 70 ? 'badge-green' : geo.geo_total >= 50 ? 'badge-yellow' : 'badge-red'}`}>Grade: {geo.geo_grade}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2, lineHeight: 1.6 }}>
                  GEO measures how well each AI system understands, trusts, and cites your site.
                  Higher score = more AI-generated referrals.
                </div>
              </div>
            </div>
          </div>

          {/* LLM cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {Object.entries(geo.llms || {}).map(([key, dim]) => {
              const meta = GEO_LLM_META[key] || { name: key, emoji: '🤖', color: '#6b7280' }
              const badge = statusBadge(dim.status)
              const pct = Math.round((dim.score / dim.max) * 100)
              return (
                <div key={key} className="card flex col gap-12" style={{ borderTop: `3px solid ${meta.color}` }}>
                  {/* Card header */}
                  <div className="flex between center">
                    <div className="flex center gap-10">
                      <span style={{ fontSize: 13 }}>{meta.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{meta.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{meta.company}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: meta.color, fontVariantNumeric: 'tabular-nums' }}>{dim.score}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}>/{dim.max}</span></span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: 10 }}>{badge.label}</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div style={{ background: 'var(--border)', borderRadius: 4, height: 6 }}>
                    <div style={{ height: 6, borderRadius: 4, background: meta.color, width: `${pct}%`, transition: 'width 0.6s', opacity: 0.85 }} />
                  </div>

                  {/* Recommendations */}
                  {dim.recommendations?.length > 0 && (
                    <div className="flex col gap-6">
                      {dim.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-8" style={{ fontSize: 13, color: 'var(--subtle)' }}>
                          <span style={{ color: meta.color, flexShrink: 0, marginTop: 1 }}>•</span>
                          <span style={{ lineHeight: 1.5 }}>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Top recommendations */}
          {geo.top_recommendations?.length > 0 && (
            <div className="card flex col gap-12">
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                🎯 Top actions to improve your GEO score
              </div>
              <div className="flex col gap-8">
                {geo.top_recommendations.map((rec, i) => {
                  // rec may be a string OR {llm, action} object — handle both
                  const llmName = typeof rec === 'object' && rec !== null ? rec.llm : null
                  const actionText = typeof rec === 'object' && rec !== null ? rec.action : String(rec)
                  return (
                    <div key={i} className="flex gap-12 center" style={{ padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}>
                      <span style={{ fontSize: 13, flexShrink: 0, width: 24, textAlign: 'center', fontWeight: 700, color: i === 0 ? '#f59e0b' : i === 1 ? 'var(--muted)' : 'var(--border2)' }}>{i + 1}</span>
                      <span style={{ color: 'var(--subtle)', lineHeight: 1.5 }}>
                        {llmName && <span style={{ fontWeight: 600, color: 'var(--text)', marginRight: 6 }}>[{llmName}]</span>}
                        {actionText}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* What is GEO */}
          <div className="card flex col gap-10" style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>What is GEO?</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--subtle)' }}>Generative Engine Optimization (GEO)</strong> is the practice of making your site more likely to be cited, recommended, and used as a source by AI systems like ChatGPT, Perplexity, Claude, Gemini, Grok, and Llama.
              Unlike traditional SEO which targets search ranking algorithms, GEO targets the training data signals and real-time retrieval signals that LLMs use to determine which sources to cite.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginTop: 4 }}>
              {[
                { icon: '📝', title: 'Content depth', desc: 'Rich capabilities + use cases' },
                { icon: '🔗', title: 'Authority signals', desc: 'Docs, pricing, status page URLs' },
                { icon: '🏗️', title: 'Structured data', desc: 'Schema.org, OpenAPI, SDKs' },
                { icon: '⚡', title: 'Freshness', desc: 'Recently updated registries' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Citation Tracker ──────────────────────────────────────────────────────────

function CitedBadge({ cited, snippet }) {
  if (cited == null) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
  return (
    <span
      title={snippet || (cited ? 'Cited in response' : 'Not mentioned')}
      style={{
        padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
        cursor: snippet ? 'help' : 'default',
        background: cited ? 'rgba(74,173,82,0.15)' : 'rgba(229,72,77,0.10)',
        color: cited ? 'var(--green)' : 'var(--red)',
        whiteSpace: 'nowrap',
      }}
    >
      {cited ? '✓ Cited' : '✗ Not cited'}
    </span>
  )
}

function WeeklyBarChart({ weeks }) {
  if (!weeks || weeks.length === 0) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>No data yet</div>
  const maxChecks = Math.max(...weeks.map(w => w.total_checks), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 72 }}>
      {weeks.map((w, i) => {
        const pct = w.total_checks > 0 ? w.citations / w.total_checks : 0
        const barH = Math.max(4, Math.round(pct * 56))
        const barColor = pct > 0.5 ? 'var(--green)' : pct > 0 ? 'var(--accent)' : 'var(--border2)'
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{w.citations}/{w.total_checks}</div>
            <div style={{ width: '100%', height: 56, background: 'var(--border)', borderRadius: 4, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: barH, background: barColor, borderRadius: 4, transition: 'height 0.4s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>W{i + 1}</div>
          </div>
        )
      })}
    </div>
  )
}

function CitationTrackerPage() {
  const [me, setMe] = useState(null)
  const [meLoading, setMeLoading] = useState(true)
  const [domains, setDomains] = useState([])
  const [selected, setSelected] = useState('')

  const [queries, setQueries] = useState([])
  const [results, setResults] = useState(null)
  const [trend, setTrend] = useState(null)
  const [loading, setLoading] = useState(false)

  // Add query form
  const [addType, setAddType] = useState('keyword')
  const [addValue, setAddValue] = useState('')
  const [adding, setAdding] = useState(false)

  // Check run polling
  const [checking, setChecking] = useState(false)
  const [checkRunId, setCheckRunId] = useState(null)

  useEffect(() => {
    Promise.all([
      api.getMe().catch(() => null),
      api.getMyDomains().catch(() => ({ domains: [] })),
      api.listRegistries().catch(() => ({ registries: [] })),
    ]).then(([meData, domainsData, regData]) => {
      setMe(meData)
      // Prefer tenant-linked domains, but fall back to all indexed registries
      // so users can test even if domains aren't formally linked to their key
      const tenantDoms = domainsData?.domains || []
      const registryDoms = (regData?.registries || []).map(r => r.domain)
      const doms = tenantDoms.length > 0 ? tenantDoms : registryDoms
      setDomains(doms)
      if (doms.length > 0) setSelected(doms[0])
    }).finally(() => setMeLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    // isPro = true during testing, so always load regardless of me/plan
    loadData(selected)
  }, [selected])

  const loadData = (domain) => {
    setLoading(true)
    Promise.all([
      api.getCitationQueries(domain).catch(() => ({ queries: [] })),
      api.getCitationResults(domain).catch(() => null),
      api.getCitationTrend(domain).catch(() => null),
    ]).then(([qData, rData, tData]) => {
      setQueries(qData?.queries || [])
      setResults(rData)
      setTrend(tData)
    }).finally(() => setLoading(false))
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addValue.trim()) return
    setAdding(true)
    try {
      await api.addCitationQuery(selected, addType, addValue.trim())
      setAddValue('')
      loadData(selected)
      toast.success(`${addType === 'keyword' ? 'Keyword' : 'Question'} added`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (queryId) => {
    try {
      await api.removeCitationQuery(selected, queryId)
      loadData(selected)
      toast.info('Removed')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleCheck = async () => {
    setChecking(true)
    try {
      const res = await api.triggerCitationCheck(selected)
      setCheckRunId(res.run_id)
      toast.info('Check started — asking AI engines now…')

      // Poll /history until our run_id appears or 60s timeout
      const started = Date.now()
      const interval = setInterval(async () => {
        if (Date.now() - started > 60000) {
          clearInterval(interval)
          setChecking(false)
          toast.error('Check timed out — results may still appear in a minute')
          return
        }
        try {
          const hist = await api.getCitationHistory(selected)
          const found = (hist?.runs || []).find(r => r.run_id === res.run_id)
          if (found) {
            clearInterval(interval)
            setChecking(false)
            setCheckRunId(null)
            loadData(selected)
            toast.success('Citation check complete!')
          }
        } catch { }
      }, 5000)
    } catch (err) {
      setChecking(false)
      toast.error(err.message)
    }
  }

  const TREND_ICON = { up: '↑', down: '↓', same: '→', insufficient_data: '—' }
  const TREND_COLOR = { up: 'var(--green)', down: 'var(--red)', same: 'var(--muted)', insufficient_data: 'var(--muted)' }
  const ENGINE_LABELS = { perplexity: 'Perplexity', openai: 'ChatGPT', claude: 'Claude (training)' }

  const plan = me?.plan || 'free'
  const isPro = true // TODO: restore after testing — ['pro', 'agency', 'enterprise'].includes(plan)

  // ── Plan gate ──
  if (!isPro) {
    return (
      <div className="flex col gap-24" style={{ maxWidth: 680 }}>
        <PageHeader title="Citation Tracker" subtitle="Track whether AI engines cite your site when asked relevant questions" />
        <div className="card flex col gap-16" style={{ textAlign: 'center', padding: '52px 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 4 }}>◉</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Citation Tracker — Pro only</div>
          <p style={{ color: 'var(--subtle)', fontSize: 14, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 8px' }}>
            Track whether Perplexity, ChatGPT, and Claude cite your domain when asked questions in your industry.
            See citation trends over time — the AI equivalent of keyword rankings.
          </p>
          <div className="flex col gap-8" style={{ maxWidth: 320, margin: '0 auto 20px', textAlign: 'left' }}>
            {['Add keywords or full questions to track', 'We ask Perplexity, ChatGPT, Claude weekly', 'See who cited you and what they said', 'Track your citation trend over time'].map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--subtle)', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--green)' }}>✓</span> {f}
              </div>
            ))}
          </div>
          <a href="https://galuli.io/checkout/buy/e280dc25-998e-4ca5-b224-5d6548d8f4e0" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-block', margin: '0 auto' }}>
            Upgrade to Pro — $29/mo →
          </a>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Cancel anytime · No credit card until you upgrade</div>
        </div>
      </div>
    )
  }

  // ── No domains ──
  if (domains.length === 0) {
    return (
      <div className="flex col gap-24">
        <PageHeader title="Citation Tracker" subtitle="Track whether AI engines cite your site" />
        <EmptyState icon="◉" title="No domains indexed yet" description="Index a site first to start tracking citations." action={null} />
      </div>
    )
  }

  // ── Detect which engines are in results ──
  const enginesInResults = results?.queries?.length > 0
    ? [...new Set(results.queries.flatMap(q => Object.keys(q.engines || {})))]
    : ['perplexity', 'claude']

  return (
    <div className="flex col gap-24" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="flex between center wrap gap-12">
        <PageHeader
          title="Citation Tracker"
          subtitle="Are AI engines citing your site when users ask relevant questions?"
        />
        <div className="flex gap-8 center">
          {domains.length > 1 && (
            <select value={selected} onChange={e => setSelected(e.target.value)} style={{ minWidth: 200 }}>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleCheck}
            disabled={checking || queries.length === 0}
          >
            {checking ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Checking…</> : '▶ Check now'}
          </button>
        </div>
      </div>

      {checking && (
        <div className="card flex center gap-12" style={{ padding: '16px 20px', background: 'rgba(94,106,210,0.07)', borderColor: 'var(--accent)' }}>
          <span className="spinner" />
          <span style={{ fontSize: 13, color: 'var(--subtle)' }}>
            Asking Perplexity, Claude, and ChatGPT your questions… This takes 30–60 seconds.
          </span>
        </div>
      )}

      {/* Trend summary */}
      {trend && (
        <div className="card flex col gap-16">
          <div className="flex between center">
            <div style={{ fontWeight: 700, fontSize: 13 }}>Citation trend (last {trend.weeks?.length || 4} weeks)</div>
            {trend.trend && trend.trend !== 'insufficient_data' && (
              <span style={{ fontSize: 16, fontWeight: 700, color: TREND_COLOR[trend.trend] }}>
                {TREND_ICON[trend.trend]} {trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1)}
              </span>
            )}
            {trend.trend === 'insufficient_data' && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Run more checks for trend data</span>
            )}
          </div>
          <WeeklyBarChart weeks={trend.weeks || []} />
        </div>
      )}

      {/* Query manager */}
      <div className="card flex col gap-16">
        <div className="flex between center">
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Tracked keywords & questions</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
              {queries.length}/5 slots used · We ask these to AI engines each week
            </div>
          </div>
        </div>

        {/* Existing queries */}
        {queries.length > 0 && (
          <div className="flex col gap-8">
            {queries.map(q => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, fontWeight: 600, background: q.type === 'keyword' ? 'rgba(94,106,210,0.15)' : 'rgba(74,173,82,0.12)', color: q.type === 'keyword' ? 'var(--accent2)' : 'var(--green)', flexShrink: 0, marginTop: 1 }}>
                  {q.type === 'keyword' ? 'keyword' : 'question'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{q.value}</div>
                  {q.type === 'keyword' && q.generated_question && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>→ "{q.generated_question}"</div>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleRemove(q.id)}
                  style={{ color: 'var(--muted)', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {queries.length < 5 && (
          <form onSubmit={handleAdd} className="flex col gap-10" style={{ borderTop: queries.length > 0 ? '1px solid var(--border)' : 'none', paddingTop: queries.length > 0 ? 14 : 0 }}>
            <div className="flex gap-8">
              <button type="button" onClick={() => setAddType('keyword')} className={`btn btn-sm ${addType === 'keyword' ? 'btn-primary' : 'btn-ghost'}`}>Keyword</button>
              <button type="button" onClick={() => setAddType('question')} className={`btn btn-sm ${addType === 'question' ? 'btn-primary' : 'btn-ghost'}`}>Full question</button>
            </div>
            <div className="flex gap-8">
              <input
                value={addValue}
                onChange={e => setAddValue(e.target.value)}
                placeholder={addType === 'keyword' ? 'e.g. GEO optimization tools' : 'e.g. What is the best tool for AI SEO?'}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={adding || !addValue.trim()}>
                {adding ? '…' : '+ Add'}
              </button>
            </div>
            {addType === 'keyword' && addValue.trim() && (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Will ask: "What are the top solutions for {addValue.trim()}?" (auto-generated)
              </div>
            )}
          </form>
        )}

        {queries.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
            Add your first keyword or question above to start tracking citations
          </div>
        )}
      </div>

      {/* Results grid */}
      {results && results.queries?.length > 0 && (
        <div className="card flex col gap-14">
          <div className="flex between center">
            <div style={{ fontWeight: 700, fontSize: 13 }}>Latest results</div>
            {results.last_checked && (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Last checked: {new Date(results.last_checked).toLocaleString()}
              </div>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Question asked</th>
                  {enginesInResults.map(eng => (
                    <th key={eng} style={{ padding: '6px 10px', textAlign: 'center', color: 'var(--muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      {ENGINE_LABELS[eng] || eng}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.queries.map(q => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '10px 10px', verticalAlign: 'top', maxWidth: 320 }}>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>{q.value}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{q.generated_question}</div>
                    </td>
                    {enginesInResults.map(eng => {
                      const r = q.engines?.[eng]
                      return (
                        <td key={eng} style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {r
                            ? <CitedBadge cited={r.cited} snippet={r.snippet} />
                            : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}
                          {r?.error && !r?.cited && (
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }} title={r.error}>⚠ error</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            💡 Hover over any badge to see the snippet from the AI response. "Claude (training)" reflects Claude's training data, not live web results.
          </div>
        </div>
      )}

      {/* Empty results state */}
      {(!results || results.queries?.length === 0) && queries.length > 0 && !checking && (
        <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>◉</div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Not checked yet</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            Click "Check now" to ask AI engines your questions and see if they cite {selected}.
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleCheck}>▶ Run first check</button>
        </div>
      )}
    </div>
  )
}

// ── URL hash helpers ──────────────────────────────────────────────────────────
const VALID_PAGES = ['overview', 'score', 'geo', 'analytics', 'content-doctor', 'citations', 'snippet', 'settings', 'ingest', 'registries', 'tenants']

function getPageFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '').trim()
  return VALID_PAGES.includes(hash) ? hash : 'overview'
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(getPageFromHash)
  const [health, setHealth] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('galuli_theme') || 'light')
  const [pendingScanDomain, setPendingScanDomain] = useState(null)

  // Sync hash → page on back/forward navigation
  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Wrapped setPage that also updates the URL hash
  const navigate = useCallback((p) => {
    window.location.hash = p
    setPage(p)
  }, [])

  // Apply theme class to <html> on mount + change
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') root.classList.add('light')
    else root.classList.remove('light')
    localStorage.setItem('galuli_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    api.health().then(setHealth).catch(() => { })
  }, [])

  const pages = {
    overview: <OverviewPage setPage={navigate} setPendingScanDomain={setPendingScanDomain} />,
    score: <ScorePage pendingDomain={pendingScanDomain} clearPending={() => setPendingScanDomain(null)} />,
    geo: <GeoPage />,
    analytics: <AnalyticsPage setPage={navigate} />,
    'content-doctor': <ContentDoctorPage />,
    citations: <CitationTrackerPage />,
    snippet: <SnippetPage />,
    settings: <SettingsPage setPage={navigate} />,
    // Hidden pages — reachable via buttons, not main nav
    ingest: <IngestPage />,
    registries: <RegistriesPage />,
    tenants: <TenantsPage />,
  }

  return (
    <div className="app-shell">
      <Nav page={page} setPage={navigate} health={health} theme={theme} toggleTheme={toggleTheme} />
      <main className="main-content">
        {pages[page] ?? <OverviewPage setPage={navigate} />}
      </main>
      <ToastContainer />
    </div>
  )
}
