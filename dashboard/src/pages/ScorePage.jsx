import { useState, useEffect } from 'react'
import { api } from '../api'
import { PageHeader, ScoreRing, CopyBtn, TabExplainer } from '../components'

export default function ScorePage({ pendingDomain, clearPending }) {
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

  // The Stack framework — 3 dimensions mapped to L1 + L4 + cross-layer freshness
  const dimColors = {
    'Entity Establishment': 'var(--accent2)',
    'Content Retrieval':    'var(--green)',
    'Freshness':            'var(--blue)',
  }
  const dimDesc = {
    'Entity Establishment': 'L1 — Does AI know you exist? Schema.org, robots.txt, Wikidata, content identity. Entity resolution happens before retrieval.',
    'Content Retrieval':    'L4 — Can your content be retrieved and cited? Coverage, capability density, AI comprehension score, monitoring depth.',
    'Freshness':            '76.4% of AI-cited pages were updated within 30 days. Stale data means AI cites outdated or inaccurate information.',
  }
  const priorityColor = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--muted)' }

  return (
    <div className="flex col gap-24">
      <div className="flex between center wrap gap-12">
        <PageHeader title="AI Visibility Score" subtitle="Built on The Stack — entity resolution + content retrieval + freshness." />
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
          title="AI Visibility Score — built on The Stack framework"
          description="A 0–100 score across 3 dimensions mapped to the AI visibility architecture (88 sources). Entity resolution happens before retrieval. Scan a site from Overview to see yours."
          features={[
            { icon: '🏛️', label: 'Entity Establishment (0–35) — L1', sub: 'Are you a resolved entity? Schema.org, robots.txt, content identity.' },
            { icon: '📡', label: 'Content Retrieval (0–40) — L4', sub: 'Pages crawled, capability density, AI comprehension score, monitoring depth.' },
            { icon: '⏱️', label: 'Freshness (0–25)', sub: '76.4% of AI-cited pages were updated within 30 days.' },
            { icon: '🏷️', label: 'Embeddable badge', sub: 'Show your AI Visibility Score — auto-updates with score.' },
            { icon: '🔍', label: 'Entity Check tool', sub: 'Live Wikidata, directory, and schema audit — no install needed.' },
          ]}
        />
      )}

      {!polling && loading && <div className="flex center gap-12" style={{ padding: 40, color: 'var(--muted)' }}><span className="spinner" /> Calculating score…</div>}

      {!polling && !loading && !score && registries.length > 0 && (
        <div className="card flex col gap-12" style={{ padding: '32px 28px', textAlign: 'center', alignItems: 'center' }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Could not load score for <strong style={{ color: 'var(--text)' }}>{selected}</strong></span>
          <button className="btn btn-ghost btn-sm" onClick={() => loadScore(selected)}>Retry →</button>
        </div>
      )}

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
                { range: '85–100', grade: 'A', color: 'var(--green)', label: 'Strong AI Visibility' },
                { range: '70–84',  grade: 'B', color: 'var(--blue)',  label: 'Good AI Visibility' },
                { range: '55–69',  grade: 'C', color: 'var(--yellow)', label: 'Partial AI Visibility' },
                { range: '40–54',  grade: 'D', color: 'var(--red)',   label: 'Weak AI Visibility' },
                { range: '0–39',   grade: 'F', color: '#991b1b',      label: 'Not Visible to AI' },
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
            <div className="flex between center">
              <div style={{ fontWeight: 700, fontSize: 13 }}>Score breakdown — The Stack</div>
              <a href="https://galuli.io/blog/what-is-geo" style={{ fontSize: 12, color: 'var(--accent)' }}>Framework explained ↗</a>
            </div>
            {Object.entries(score.dimensions || {}).map(([key, dim]) => (
              <div key={key} className="flex col gap-6">
                <div className="flex between center" style={{ fontSize: 13 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600 }}>{key}</span>
                    {dim.layer && <span style={{ fontSize: 10, background: 'rgba(94,106,210,0.1)', border: '1px solid rgba(94,106,210,0.2)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 3, marginLeft: 8, fontWeight: 600 }}>{dim.layer}</span>}
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{dimDesc[key] || dim.description}</div>
                  </div>
                  <span style={{ color: 'var(--subtle)', fontVariantNumeric: 'tabular-nums', fontWeight: 600, marginLeft: 16, flexShrink: 0 }}>
                    {dim.score}<span style={{ color: 'var(--muted)', fontWeight: 400 }}>/{dim.max}</span>
                  </span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 4, height: 7 }}>
                  <div style={{ height: 7, borderRadius: 4, background: dimColors[key] || 'var(--accent2)', width: `${(dim.score / dim.max) * 100}%`, transition: 'width 0.6s' }} />
                </div>
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
