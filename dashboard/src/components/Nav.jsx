import { NAV_SECTIONS } from '../constants'

export default function Nav({ page, setPage, health, theme, toggleTheme }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <a
        href="/"
        className="sidebar-logo"
        onClick={e => { e.preventDefault(); setPage('overview') }}
      >
        <div className="sidebar-logo-icon">g</div>
        <span>galuli</span>
      </a>

      {/* Sectioned nav */}
      {NAV_SECTIONS.map(section => (
        <div key={section.label} className="sidebar-section">
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--muted)',
            letterSpacing: '0.7px', padding: '8px 12px 4px',
            textTransform: 'uppercase',
          }}>
            {section.label}
          </div>
          {section.items.map(l => (
            <button
              key={l.id}
              className={`sidebar-item${page === l.id ? ' active' : ''}`}
              onClick={() => setPage(l.id)}
              title={l.tooltip}
            >
              <span className="sidebar-item-icon">{l.icon}</span>
              <span>{l.label}</span>
              {l.highlight && (
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                  background: 'rgba(94,106,210,0.15)', color: 'var(--accent)',
                  padding: '1px 5px', borderRadius: 3, letterSpacing: 0.3,
                }}>NEW</span>
              )}
            </button>
          ))}
        </div>
      ))}

      {/* Settings + footer at bottom */}
      <div style={{ marginTop: 'auto' }}>
        <div className="sidebar-section">
          <button
            className={`sidebar-item${page === 'settings' ? ' active' : ''}`}
            onClick={() => setPage('settings')}
            title="Account settings, plan details, API keys, and upgrade options"
          >
            <span className="sidebar-item-icon">{'\u2699'}</span>
            <span>Settings</span>
          </button>
        </div>

        {/* Footer — status + theme toggle */}
        <div className="sidebar-footer">
          {health && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', marginBottom: 8, padding: '0 4px' }}>
              <span className={`dot dot-${health.anthropic_configured ? 'green' : 'red'}`} />
              <span>{health.registries_indexed} site{health.registries_indexed !== 1 ? 's' : ''} indexed</span>
            </div>
          )}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="sidebar-item"
            style={{ width: '100%' }}
          >
            <span className="sidebar-item-icon">{theme === 'dark' ? '\u2600' : '\uD83C\uDF19'}</span>
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
