import { useState, useEffect } from 'react'
import { api } from '../api'
import { toast } from '../toast'
import { PageHeader, CopyBtn, TabExplainer } from '../components'

export default function SnippetPage() {
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
      .then(d => {
        const list = d.domains || []
        setDomains(list)
        if (list.length > 0) localStorage.setItem('galuli_snippet_active', '1')
      })
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

      {/* Status banner */}
      {domains.length > 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: 'rgba(74,173,82,0.08)', border: '1px solid rgba(74,173,82,0.25)',
          borderRadius: 8, fontSize: 13,
        }}>
          <span className="dot dot-green" style={{ width: 8, height: 8, flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: 'var(--green)' }}>Snippet active</span>
          <span style={{ color: 'var(--subtle)' }}>—</span>
          <span style={{ color: 'var(--subtle)' }}>
            Running on {domains.length} domain{domains.length !== 1 ? 's' : ''}: {domains.slice(0, 3).join(', ')}{domains.length > 3 ? ` +${domains.length - 3} more` : ''}
          </span>
        </div>
      ) : selectedKey ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: 'rgba(217,165,58,0.08)', border: '1px solid rgba(217,165,58,0.25)',
          borderRadius: 8, fontSize: 13,
        }}>
          <span style={{ fontSize: 14 }}>⚠</span>
          <span style={{ fontWeight: 600, color: 'var(--yellow)' }}>Snippet not installed yet</span>
          <span style={{ color: 'var(--subtle)' }}>— follow steps below to activate</span>
        </div>
      ) : null}

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Step 2 — Add to your site's <code>&lt;head&gt;</code></div>
          <a href="/install" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
            Platform-specific guides ↗
          </a>
        </div>
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
