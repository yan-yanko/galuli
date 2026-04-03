import { useState, useEffect } from 'react'
import { api } from '../api'
import { toast } from '../toast'
import { PageHeader, ScoreRing, OnboardingChecklist, TabExplainer } from '../components'

export default function OverviewPage({ setPage, setPendingScanDomain }) {
  const [registries, setRegistries] = useState([])
  const [scores, setScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [scanUrl, setScanUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(null)

  useEffect(() => {
    Promise.all([
      api.listRegistries().catch(() => ({ registries: [] })),
    ]).then(([r]) => {
      const regs = r?.registries || []
      setRegistries(regs)
      regs.forEach(reg => {
        api.getScore(reg.domain)
          .then(s => setScores(prev => ({ ...prev, [reg.domain]: s })))
          .catch(() => setScores(prev => ({ ...prev, [reg.domain]: 'failed' })))
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
    if (!localStorage.getItem('galuli_api_key')) {
      setConfirmingDelete(null)
      toast.info('You need a free account to remove sites. Redirecting…')
      setPage('snippet')
      return
    }
    if (confirmingDelete !== domain) {
      setConfirmingDelete(domain)
      return
    }
    setConfirmingDelete(null)
    try {
      await api.deleteRegistry(domain)
      setRegistries(prev => prev.filter(r => r.domain !== domain))
      setScores(prev => { const n = { ...prev }; delete n[domain]; return n })
      toast.success(`${domain} removed`)
    } catch (err) {
      toast.error('Could not remove: ' + err.message)
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

  const hasKey = !!localStorage.getItem('galuli_api_key')
  const hasSnippet = !!localStorage.getItem('galuli_snippet_active') || scores_arr.some(s => s?.dimensions?.webmcp_compliance?.webmcp_enabled)

  return (
    <div className="flex col gap-20">
      <PageHeader title="Overview" subtitle="Your AI accessibility dashboard" />

      <OnboardingChecklist
        hasKey={hasKey}
        hasScan={hasData}
        hasSnippet={hasSnippet}
        onNavigate={setPage}
      />

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

      {hasData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {[
            { label: 'Sites indexed', value: registries.length, color: 'var(--accent)' },
            { label: 'Avg AI score', value: avgScore !== null ? `${avgScore}/100` : '—', color: avgScore === null ? 'var(--muted)' : avgScore >= 70 ? 'var(--green)' : avgScore >= 50 ? 'var(--yellow)' : 'var(--red)' },
            { label: 'WebMCP sites', value: scores_arr.filter(s => s?.dimensions?.webmcp_compliance?.webmcp_enabled).length, color: 'var(--purple)' },
          ].map(c => (
            <div key={c.label} className="stat-card">
              <div className="stat-value" style={{ color: c.color, fontSize: 14 }}>{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {hasData && (
        <div className="flex col gap-2">
          <div className="flex between center" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--subtle)' }}>Indexed sites</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('registries')}>View all →</button>
          </div>
          {registries.map(r => {
            const s = scores[r.domain]
            const scoreFailed = s === 'failed'
            const scoreLoaded = s && s !== 'failed'
            const scoreColor = scoreLoaded ? (s.total >= 70 ? 'var(--green)' : s.total >= 50 ? 'var(--yellow)' : 'var(--red)') : 'var(--muted)'
            return (
              <div key={r.domain} className="card" style={{ padding: '14px 18px' }}>
                <div className="flex center gap-16 wrap">
                  {scoreLoaded
                    ? <ScoreRing score={s.total} size={56} />
                    : scoreFailed
                      ? <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer' }}
                          title="Retry score"
                          onClick={() => {
                            setScores(prev => { const n = { ...prev }; delete n[r.domain]; return n })
                            api.getScore(r.domain).then(sc => setScores(prev => ({ ...prev, [r.domain]: sc }))).catch(() => setScores(prev => ({ ...prev, [r.domain]: 'failed' })))
                          }}>↺</div>
                      : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" style={{ width: 16, height: 16 }} /></div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{r.domain}</div>
                    {scoreLoaded && <div style={{ fontSize: 13, color: scoreColor }}>{s.label} · {s.total}/100 · Grade {s.grade}</div>}
                    {scoreFailed && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Score unavailable — click ↺ to retry</div>}
                    {scoreLoaded && s?.suggestions?.[0]?.issue && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>💡 {s.suggestions[0].issue}</div>}
                  </div>
                  <div className="flex gap-6 wrap" style={{ flexShrink: 0, alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPage('score')}>Score</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPage('analytics')}>Analytics</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setPage('snippet')}>Install</button>
                    {confirmingDelete === r.domain ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: 'var(--subtle)', whiteSpace: 'nowrap' }}>Remove?</span>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.domain)} style={{ fontSize: 11, padding: '3px 10px' }}>Yes</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setConfirmingDelete(null)} style={{ fontSize: 11, padding: '3px 10px' }}>No</button>
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
