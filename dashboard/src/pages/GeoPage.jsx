import { useState, useEffect } from 'react'
import { api } from '../api'
import { GEO_LLM_META } from '../constants'
import { PageHeader, ScoreRing, TabExplainer } from '../components'

export default function GeoPage() {
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

      {!loading && !geo && registries.length > 0 && (
        <div className="card flex col gap-12" style={{ padding: '32px 28px', textAlign: 'center', alignItems: 'center' }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Could not load GEO score for <strong style={{ color: 'var(--text)' }}>{selected}</strong></span>
          <button className="btn btn-ghost btn-sm" onClick={() => loadGeo(selected)}>Retry →</button>
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
