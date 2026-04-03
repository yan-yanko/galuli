import { useState, useEffect } from 'react'
import { api } from '../api'
import { PageHeader, TabExplainer, SeverityBadge, ScoreGauge } from '../components'

export default function ContentDoctorPage() {
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
  const isPaid = ['starter', 'pro', 'agency', 'enterprise'].includes(plan)

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
            Upgrade to Starter — $29/mo →
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
