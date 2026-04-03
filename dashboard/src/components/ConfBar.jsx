export default function ConfBar({ score }) {
  const pct = Math.round((score || 0) * 100)
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div className="flex center gap-8" style={{ fontSize: 13, color: 'var(--muted)' }}>
      <div className="conf-bar"><div className="conf-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <span style={{ color }}>{pct}% confidence</span>
    </div>
  )
}
