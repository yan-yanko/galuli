import { useState, useEffect } from 'react'
import { api } from '../api'
import { toast } from '../toast'
import { PageHeader, EmptyState } from '../components'

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

export default function CitationTrackerPage() {
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
  const isPro = ['pro', 'agency', 'enterprise'].includes(plan)

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
            Upgrade to Pro — $79/mo →
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
