export default function SeverityBadge({ severity }) {
  const map = { high: ['#ef4444', '#ef444420'], medium: ['#f59e0b', '#f59e0b20'], low: ['var(--muted)', 'var(--border)'] }
  const [color, bg] = map[severity] || map.low
  return <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, padding: '2px 7px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>{severity}</span>
}
