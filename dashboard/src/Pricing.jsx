import { useState } from 'react'

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : window.location.origin

// ── Plan data (mirrors backend PLANS) ────────────────────────────────────────
const PLANS = [
  {
    id: null,
    plan: 'free',
    name: 'Free',
    billing: 'forever',
    priceDisplay: '$0',
    priceMonthly: 0,
    sites: 3,
    jsEnabled: false,
    highlight: false,
    badge: null,
    features: [
      { text: '3 sites — scan only', ok: true },
      { text: 'AI Readiness Score', ok: true },
      { text: 'GEO Score (6 LLMs)', ok: true },
      { text: 'AI agent analytics', ok: true },
      { text: 'JS snippet / activation', ok: false },
      { text: 'Auto llms.txt serving', ok: false },
      { text: 'WebMCP registration', ok: false },
      { text: 'Auto weekly re-scan', ok: false },
    ],
    cta: 'Start free',
    ctaAction: 'signup',
  },
  {
    id_monthly: 'starter_monthly',
    id_yearly: 'starter_yearly',
    plan: 'starter',
    name: 'Starter',
    billing: 'monthly',
    priceDisplay: '$29',
    priceYearly: '$249',
    priceMonthly: 29,
    sites: 3,
    jsEnabled: true,
    highlight: false,
    badge: null,
    features: [
      { text: '3 sites', ok: true },
      { text: 'AI Readiness Score', ok: true },
      { text: 'GEO Score (6 LLMs)', ok: true },
      { text: 'AI agent analytics', ok: true },
      { text: 'JS snippet activation ✓', ok: true },
      { text: 'Auto llms.txt serving ✓', ok: true },
      { text: 'WebMCP registration ✓', ok: true },
      { text: 'Weekly auto-rescan ✓', ok: true },
      { text: 'Content Doctor ✓', ok: true },
    ],
    cta: 'Get Starter',
    ctaAction: 'checkout',
  },
  {
    id_monthly: 'pro_monthly',
    id_yearly: 'pro_yearly',
    plan: 'pro',
    name: 'Pro',
    billing: 'monthly',
    priceDisplay: '$79',
    priceYearly: '$679',
    priceMonthly: 79,
    sites: 10,
    jsEnabled: true,
    highlight: true,
    badge: 'Most Popular',
    features: [
      { text: '10 sites', ok: true },
      { text: 'AI Readiness Score', ok: true },
      { text: 'GEO Score (6 LLMs)', ok: true },
      { text: 'AI agent analytics', ok: true },
      { text: 'JS snippet activation ✓', ok: true },
      { text: 'Auto llms.txt serving ✓', ok: true },
      { text: 'WebMCP registration ✓', ok: true },
      { text: 'Daily auto-rescan ✓', ok: true },
      { text: 'Content Doctor ✓', ok: true },
      { text: 'Score badge embed ✓', ok: true },
      { text: 'Competitor tracking ✓', ok: true },
      { text: 'Priority crawl ✓', ok: true },
    ],
    cta: 'Get Pro',
    ctaAction: 'checkout',
  },
  {
    id_monthly: 'agency_monthly',
    id_yearly: 'agency_yearly',
    plan: 'agency',
    name: 'Agency',
    billing: 'monthly',
    priceDisplay: '$199',
    priceYearly: '$1,990',
    priceMonthly: 199,
    sites: 999,
    jsEnabled: true,
    highlight: false,
    badge: null,
    features: [
      { text: 'Unlimited sites', ok: true },
      { text: 'All Pro features', ok: true },
      { text: 'White-label reports ✓', ok: true },
      { text: 'Client dashboard ✓', ok: true },
      { text: 'API access ✓', ok: true },
      { text: 'Dedicated support ✓', ok: true },
    ],
    cta: 'Get Agency',
    ctaAction: 'checkout',
  },
]

const COMPARISON = [
  { feature: 'Sites', free: '3', starter: '3', pro: '10', agency: '∞' },
  { feature: 'AI Readiness Score', free: '✓', starter: '✓', pro: '✓', agency: '✓' },
  { feature: 'GEO Score (6 LLMs)', free: '✓', starter: '✓', pro: '✓', agency: '✓' },
  { feature: 'AI agent analytics', free: '✓', starter: '✓', pro: '✓', agency: '✓' },
  { feature: 'JS snippet / activation', free: '—', starter: '✓', pro: '✓', agency: '✓' },
  { feature: 'Auto llms.txt serving', free: '—', starter: '✓', pro: '✓', agency: '✓' },
  { feature: 'WebMCP registration', free: '—', starter: '✓', pro: '✓', agency: '✓' },
  { feature: 'Content Doctor', free: '—', starter: '✓', pro: '✓', agency: '✓' },
  { feature: 'Auto re-scan', free: '—', starter: 'Weekly', pro: 'Daily', agency: 'Daily' },
  { feature: 'Score badge', free: '—', starter: '—', pro: '✓', agency: '✓' },
  { feature: 'Competitor tracking', free: '—', starter: '—', pro: '✓', agency: '✓' },
  { feature: 'White-label reports', free: '—', starter: '—', pro: '—', agency: '✓' },
  { feature: 'API access', free: '—', starter: '—', pro: '—', agency: '✓' },
  { feature: 'Dedicated support', free: '—', starter: '—', pro: '—', agency: '✓' },
]

export function PricingPage({ onNavigate, onAuthRequired }) {
  const [billing, setBilling] = useState('monthly') // 'monthly' | 'yearly'
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')

  const apiKey = localStorage.getItem('galuli_api_key')

  const handleCheckout = async (plan) => {
    if (!apiKey) {
      // Need to be logged in to checkout
      onAuthRequired && onAuthRequired({ redirectTo: 'pricing', plan })
      return
    }
    if (plan.ctaAction === 'contact') {
      window.location.href = 'mailto:hello@galuli.io?subject=Agency Plan'
      return
    }
    if (plan.ctaAction === 'signup') {
      onAuthRequired && onAuthRequired({ redirectTo: 'pricing' })
      return
    }

    const planId = billing === 'yearly' ? plan.id_yearly : plan.id_monthly
    if (!planId) return

    setLoading(planId)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ plan: planId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Checkout failed')
      }
      const { checkout_url } = await res.json()
      window.location.href = checkout_url
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="blog-page">
      {/* Nav */}
      <nav className="blog-nav glass-panel">
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 22 }}>⬡</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--fg)' }}>galuli</span>
        </a>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/blog" onClick={e => { e.preventDefault(); onNavigate('blog') }} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}>Blog</a>
          <a href="/about" onClick={e => { e.preventDefault(); onNavigate('about') }} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}>About</a>
          {apiKey
            ? <a href="/dashboard/" style={{ textDecoration: 'none' }}><button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>Dashboard →</button></a>
            : <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 14 }} onClick={() => onAuthRequired && onAuthRequired({})}>Sign in</button>
          }
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="badge badge-purple" style={{ marginBottom: 16 }}>Pricing</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
            Start free. Pay when you install.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 520, margin: '0 auto 32px' }}>
            Scan any site for free. Paid plans activate continuous monitoring, auto-fixes, and the tools that get you cited by AI.
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', background: 'var(--surface2)', borderRadius: 12, padding: 4, gap: 4 }}>
            <button
              onClick={() => setBilling('monthly')}
              style={{
                padding: '8px 20px', borderRadius: 9, fontSize: 14, fontWeight: 600,
                background: billing === 'monthly' ? 'var(--accent)' : 'transparent',
                color: billing === 'monthly' ? 'white' : 'var(--muted)',
                transition: 'all 0.2s',
              }}
            >Monthly</button>
            <button
              onClick={() => setBilling('yearly')}
              style={{
                padding: '8px 20px', borderRadius: 9, fontSize: 14, fontWeight: 600,
                background: billing === 'yearly' ? 'var(--accent)' : 'transparent',
                color: billing === 'yearly' ? 'white' : 'var(--muted)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              Yearly
              <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: 'var(--green)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Save ~28%</span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 10, padding: '12px 20px', color: 'var(--red)', marginBottom: 24, textAlign: 'center', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 80 }}>
          {PLANS.map(plan => {
            const isHighlight = plan.highlight
            const price = billing === 'yearly' && plan.priceYearly ? plan.priceYearly : plan.priceDisplay
            const periodLabel = billing === 'yearly' ? '/yr' : plan.plan === 'free' ? '' : '/mo'
            const planId = billing === 'yearly' ? plan.id_yearly : plan.id_monthly

            return (
              <div key={plan.plan} className="glass-panel" style={{
                padding: '28px 24px',
                borderRadius: 20,
                border: isHighlight ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                position: 'relative',
                display: 'flex', flexDirection: 'column',
              }}>
                {isHighlight && (
                  <div className="badge badge-purple" style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 11 }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{plan.name}</div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: 'var(--fg)', lineHeight: 1 }}>{price}</span>
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>{periodLabel}</span>
                </div>
                {billing === 'yearly' && plan.priceMonthly && (
                  <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 16, fontWeight: 600 }}>
                    Save vs ${plan.priceMonthly * 12}/yr billed monthly
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>
                  {plan.sites === 999 ? 'Unlimited sites' : `${plan.sites} site${plan.sites > 1 ? 's' : ''}`}
                  {plan.jsEnabled ? ' · JS enabled' : ' · scan only'}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f.text} style={{ fontSize: 13, color: f.ok ? 'var(--fg)' : 'var(--muted)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: f.ok ? 'var(--green)' : 'var(--border2)', flexShrink: 0, marginTop: 1 }}>{f.ok ? '✓' : '—'}</span>
                      {f.text.replace(' ✓', '').replace(' —', '')}
                    </li>
                  ))}
                </ul>

                <button
                  className={`btn ${isHighlight ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ width: '100%', padding: '11px 0', fontWeight: 700 }}
                  disabled={loading === planId}
                  onClick={() => handleCheckout(plan)}
                >
                  {loading === planId ? 'Loading…' : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* Comparison table */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: 'var(--fg)', textAlign: 'center' }}>Full comparison</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>Feature</th>
                  {['Free', 'Starter', 'Pro', 'Agency'].map(h => (
                    <th key={h} style={{ textAlign: 'center', padding: '12px 16px', color: h === 'Pro' ? 'var(--accent)' : 'var(--fg)', fontWeight: 700, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '11px 16px', color: 'var(--fg)', fontWeight: 500 }}>{row.feature}</td>
                    {[row.free, row.starter, row.pro, row.agency].map((val, ci) => (
                      <td key={ci} style={{
                        textAlign: 'center', padding: '11px 16px',
                        color: val === '✓' || val === 'Weekly' || val === 'Daily' || val === '∞' ? 'var(--green)' : val === '—' ? 'var(--border2)' : 'var(--fg)',
                        fontWeight: val === '✓' ? 700 : 400,
                      }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: '0 auto 80px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: 'var(--fg)', textAlign: 'center' }}>Pricing FAQ</h2>
          {[
            { q: 'Why is the JS snippet paid?', a: "The snippet is where the ongoing value lives — AI agent analytics, auto llms.txt updates, WebMCP registration, and auto-rescans. The scan is free so you can see your score; the snippet is how you act on it continuously." },
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel in the billing portal and you keep access until the end of your billing period. No lock-in, no cancellation fees.' },
            { q: 'What happens to my data if I cancel?', a: 'Your scan results and registry data are kept for 90 days after cancellation. Your JS snippet stops receiving real-time updates but historical data stays in the dashboard.' },
            { q: 'Do you offer a free trial?', a: 'The free plan IS your trial — unlimited time, no credit card. You get to see your full AI Readiness Score and GEO breakdown before you pay anything.' },
            { q: 'Can I upgrade or downgrade mid-cycle?', a: 'Yes. Stripe handles proration automatically — you only pay for the time you actually use each plan.' },
            { q: 'Do you offer discounts?', a: 'Annual billing saves ~28%. We also offer non-profit discounts — email hello@galuli.io.' },
          ].map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)', padding: '18px 0' }}>
              <div style={{ fontWeight: 600, color: 'var(--fg)', marginBottom: 8, fontSize: 15 }}>{item.q}</div>
              <div style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>{item.a}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12, color: 'var(--fg)' }}>Still have questions?</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>We read every email.</p>
          <a href="mailto:hello@galuli.io" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '13px 32px' }}>✉️ hello@galuli.io</button>
          </a>
        </div>
      </div>
    </div>
  )
}
