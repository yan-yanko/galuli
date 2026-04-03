import { useState, useEffect } from 'react'
import { api } from '../api'
import { toast } from '../toast'
import { PageHeader, StatusBadge, ScoreRing, CopyBtn } from '../components'

function IndexResult({ result }) {
  const { registry, score } = result
  const gradeColor = score.total >= 70 ? 'var(--green)' : score.total >= 50 ? 'var(--yellow)' : 'var(--red)'
  const dimColors = { 'Entity Establishment': 'var(--accent2)', 'Content Retrieval': 'var(--green)', 'Freshness': 'var(--blue)' }
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
              <span style={{ fontWeight: 500 }}>{key}</span>
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

export default function IngestPage() {
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
