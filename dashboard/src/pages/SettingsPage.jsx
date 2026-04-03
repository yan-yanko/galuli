import { useState, useEffect } from 'react'
import { api } from '../api'
import { toast } from '../toast'
import { PLAN_DETAILS, openCheckout } from '../constants'
import { PageHeader, CopyBtn, TabExplainer, UpgradeCTAs } from '../components'

export default function SettingsPage({ setPage }) {
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
  function DangerZone() {
    const [wiping, setWiping] = useState(false)
    const handleWipe = async () => {
      if (!confirm('Remove all your indexed sites from the dashboard?\n\nThis cannot be undone.')) return
      setWiping(true)
      try {
        // Fetch THIS tenant's domains (not global wipe — no master key needed)
        const data = await api.getMyDomains().catch(() => ({ domains: [] }))
        const domains = data.domains || []
        for (const domain of domains) {
          await api.deleteRegistry(domain).catch(() => { })
        }
        toast.success('All your sites removed — reloading…')
        setTimeout(() => window.location.reload(), 1500)
      } catch (err) {
        toast.error('Wipe failed: ' + err.message)
      } finally {
        setWiping(false)
      }
    }
    return (
      <div className="card flex col gap-14" style={{ border: '1px solid #ef444430' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--red)' }}>⚠️ Danger Zone</div>
        <div className="flex between center wrap gap-12" style={{ background: 'var(--surface2)', border: '1px solid #ef444420', borderRadius: 10, padding: '14px 16px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>Remove all my sites</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Delete all your indexed sites and scan data from the dashboard. Cannot be undone.</div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleWipe}
            disabled={wiping}
          >
            {wiping
              ? <><span className="spinner" style={{ width: 13, height: 13, borderColor: '#fff3', borderTopColor: '#fff' }} /> Wiping…</>
              : 'Remove all sites →'}
          </button>
        </div>
      </div>
    )
  }

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
            { icon: '💳', label: 'Billing', sub: 'Starter $29/mo · Pro $79/mo — powered by Lemon Squeezy' },
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
