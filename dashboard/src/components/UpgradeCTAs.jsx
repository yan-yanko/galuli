import { useState } from 'react'
import { openCheckout } from '../constants'

export default function UpgradeCTAs({ plan, email }) {
  const [billing, setBilling] = useState('monthly')
  const isAnnual = billing === 'annual'
  if (plan !== 'free' && plan !== 'starter') return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Monthly / Annual toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
          {['monthly', 'annual'].map(b => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              background: billing === b ? 'var(--accent)' : 'none',
              color: billing === b ? 'white' : 'var(--muted)',
              border: 'none', transition: 'all 0.15s',
            }}>{b.charAt(0).toUpperCase() + b.slice(1)}</button>
          ))}
        </div>
        {isAnnual && <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>Save ~16% {'\uD83C\uDF89'}</span>}
      </div>

      {/* Starter card — only for free plan */}
      {plan === 'free' && (
        <div style={{ background: 'linear-gradient(135deg, var(--accent)12, var(--accent2)12)', border: '1px solid var(--accent)30', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
              Starter {'\u2014'} {isAnnual ? '$249/yr' : '$29/mo'}
              {isAnnual && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Save ~27%</span>}
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>1 site {'\u00B7'} AI traffic tracking {'\u00B7'} GEO score {'\u00B7'} Content Doctor</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openCheckout(isAnnual ? 'starter_annual' : 'starter', email)}>
            Upgrade to Starter {'\u2192'}
          </button>
        </div>
      )}

      {/* Pro card */}
      <div style={{ background: 'linear-gradient(135deg, var(--purple)10, var(--accent)10)', border: '1px solid var(--purple)30', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
            Pro {'\u2014'} {isAnnual ? '$679/yr' : '$79/mo'}
            {isAnnual && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>Save ~28%</span>}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>10 sites {'\u00B7'} priority crawls {'\u00B7'} daily rescan {'\u00B7'} Citation Tracker</div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ background: 'var(--purple)' }} onClick={() => openCheckout(isAnnual ? 'pro_annual' : 'pro', email)}>
          Upgrade to Pro {'\u2192'}
        </button>
      </div>
    </div>
  )
}
