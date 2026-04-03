import { useState } from 'react'
import InfoTip from './InfoTip'

export default function OnboardingChecklist({ hasKey, hasScan, hasSnippet, onNavigate }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('galuli_onboarding_done') === '1')
  const steps = [
    { label: 'Get your API key',    done: hasKey,     action: () => onNavigate('snippet'), actionLabel: 'Get key \u2192',    tip: 'A free API key lets you install the snippet and start monitoring your site.' },
    { label: 'Scan your first site', done: hasScan,   action: null,                        actionLabel: 'Scan \u2191',       tip: 'Paste a URL in the scan box above \u2014 results appear in ~60 seconds.' },
    { label: 'Install the snippet', done: hasSnippet, action: () => onNavigate('snippet'), actionLabel: 'Install \u2192',    tip: 'One script tag in your <head> enables live AI tracking, llms.txt, and WebMCP.' },
  ]
  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length

  if (dismissed) return null
  if (allDone) {
    setTimeout(() => { localStorage.setItem('galuli_onboarding_done', '1'); setDismissed(true) }, 3000)
  }

  return (
    <div className="card" style={{ borderColor: allDone ? 'rgba(74,173,82,0.3)' : 'rgba(94,106,210,0.25)', padding: '18px 20px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 13 }}>
            {allDone ? '\u2713 You\'re all set!' : 'Getting started'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
            {allDone ? 'Galuli is fully configured.' : `${doneCount} of ${steps.length} complete`}
          </span>
        </div>
        <button
          onClick={() => { localStorage.setItem('galuli_onboarding_done', '1'); setDismissed(true) }}
          title="Dismiss"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}
        >\u00D7</button>
      </div>
      {/* Progress bar */}
      <div style={{ background: 'var(--border)', borderRadius: 4, height: 3, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 4, background: allDone ? 'var(--green)' : 'var(--accent)', width: `${(doneCount / steps.length) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>
      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: step.done ? 'rgba(74,173,82,0.12)' : 'var(--surface2)',
              border: `1px solid ${step.done ? 'rgba(74,173,82,0.4)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
              color: step.done ? 'var(--green)' : 'var(--muted)',
            }}>
              {step.done ? '\u2713' : i + 1}
            </div>
            <span style={{ fontSize: 13, flex: 1, color: step.done ? 'var(--muted)' : 'var(--text)', textDecoration: step.done ? 'line-through' : 'none' }}>
              {step.label}
            </span>
            <InfoTip text={step.tip} />
            {!step.done && step.action && (
              <button className="btn btn-primary btn-sm" onClick={step.action} style={{ flexShrink: 0, fontSize: 12 }}>
                {step.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
