export default function ScoreGauge({ score, label, color }) {
  const c = color || (score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: c }}>{score}</div>
      <div style={{ height: 4, width: 80, borderRadius: 2, background: 'var(--border)' }}>
        <div style={{ height: 4, borderRadius: 2, background: c, width: score + '%', transition: 'width 0.5s' }} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>{label}</div>
    </div>
  )
}
