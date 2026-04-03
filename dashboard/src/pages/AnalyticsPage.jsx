import { useState, useEffect } from 'react'
import { api } from '../api'
import { AGENT_COLORS, TREND_ICON, TREND_COLOR } from '../constants'
import { PageHeader, MiniBar, TabExplainer } from '../components'

export default function AnalyticsPage({ setPage }) {
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
