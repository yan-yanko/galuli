export default function MiniBar({ value, max, color }) {
  const pct = Math.round((value / (max || 1)) * 100)
  return (
    <div style={{ background: 'var(--border)', borderRadius: 3, height: 5, flex: 1 }}>
      <div style={{ height: 5, borderRadius: 3, background: color || 'var(--accent2)', width: `${pct}%`, transition: 'width 0.4s' }} />
    </div>
  )
}
