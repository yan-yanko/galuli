export default function TabExplainer({ icon, title, description, features, cta, onCta, ctaLabel = 'Get started \u2192' }) {
  return (
    <div style={{
      borderRadius: 16,
      background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)',
      border: '1px solid var(--border)',
      padding: '28px 32px',
      marginBottom: 4,
    }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent)22, var(--accent2)22)',
          border: '1px solid var(--accent)33',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6, letterSpacing: '-0.2px' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 560, marginBottom: features ? 20 : 0 }}>{description}</div>
          {features && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {features.map(({ icon: fi, label, sub }) => (
                <div key={label} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 12px',
                }}>
                  <span style={{ fontSize: 13, flexShrink: 0, lineHeight: 1.3 }}>{fi}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {cta && onCta && (
            <button className="btn btn-primary btn-sm" onClick={onCta} style={{ marginTop: features ? 16 : 0 }}>
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
