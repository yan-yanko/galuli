import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { toast } from '../toast'
import { CopyBtn, ConfBar } from '../components'

export default function RegistriesPage() {
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
