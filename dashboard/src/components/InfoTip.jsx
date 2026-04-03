import { useState } from 'react'

export default function InfoTip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 4, cursor: 'default' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{ fontSize: 11, color: 'var(--muted)', border: '1px solid var(--border2)', borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>\u24D8</span>
      {show && (
        <span style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface3)', border: '1px solid var(--border2)',
          color: 'var(--subtle)', fontSize: 12, lineHeight: 1.5, padding: '7px 10px',
          borderRadius: 6, whiteSpace: 'normal', width: 220, textAlign: 'left',
          pointerEvents: 'none', zIndex: 1000, marginBottom: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}
