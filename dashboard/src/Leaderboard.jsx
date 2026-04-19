import { useState, useEffect } from 'react'
import { ScoreRingLanding } from './Landing.jsx'

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : window.location.origin

const GRADE_COLORS = {
  A: 'var(--green)', B: '#3b82f6', C: 'var(--yellow)', D: '#f97316', F: 'var(--red)',
}

export default function LeaderboardPage({ onNavigate }) {
  const [entries, setEntries] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('score')
  const [offset, setOffset] = useState(0)
  const LIMIT = 50

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: LIMIT, offset, sort })
    if (category) params.set('category', category)
    fetch(`${API_BASE}/api/v1/leaderboard?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setEntries(data.entries || [])
          setCategories(data.categories || [])
          setTotal(data.total || 0)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [category, sort, offset])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav */}
      <nav style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}>
          <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 800 }}>g</div>
          galuli
        </a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/developers" className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--subtle)' }}>API</a>
          <a href="/pricing" className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--subtle)' }}>Pricing</a>
          <a href="/" className="btn btn-primary btn-sm">Scan your site</a>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px 64px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>AI Readiness Leaderboard</h1>
          <p style={{ fontSize: 14, color: 'var(--subtle)' }}>
            {total} sites ranked by AI visibility score. <a href="/" style={{ color: 'var(--accent)' }}>Check your site</a> to join.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category pills */}
          <button
            onClick={() => { setCategory(''); setOffset(0) }}
            className={`btn btn-sm ${!category ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 11 }}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setOffset(0) }}
              className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 11 }}
            >{cat}</button>
          ))}

          {/* Sort toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button
              onClick={() => { setSort('score'); setOffset(0) }}
              className={`btn btn-sm ${sort === 'score' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 11 }}
            >Top Scores</button>
            <button
              onClick={() => { setSort('recent'); setOffset(0) }}
              className={`btn btn-sm ${sort === 'recent' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 11 }}
            >Recently Scanned</button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, color: 'var(--subtle)' }}>Loading leaderboard...</div>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 14, color: 'var(--subtle)' }}>No sites found{category ? ` in "${category}"` : ''}.</div>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 80px 60px 140px 100px', gap: 0, padding: '8px 16px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>#</span>
              <span>Domain</span>
              <span style={{ textAlign: 'center' }}>Score</span>
              <span style={{ textAlign: 'center' }}>Grade</span>
              <span>Category</span>
              <span style={{ textAlign: 'right' }}>Updated</span>
            </div>
            {/* Rows */}
            {entries.map((entry) => (
              <a
                key={entry.domain}
                href={`/scan/${entry.domain}`}
                style={{ display: 'grid', gridTemplateColumns: '48px 1fr 80px 60px 140px 100px', gap: 0, padding: '10px 16px', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit', alignItems: 'center', transition: 'background 0.15s' }}
                className="leaderboard-row"
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{entry.rank}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <img src={`https://www.google.com/s2/favicons?domain=${entry.domain}&sz=32`} width={18} height={18} style={{ borderRadius: 3, flexShrink: 0 }} alt="" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.domain}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ScoreRingLanding score={entry.score} size={32} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: GRADE_COLORS[entry.grade] || 'var(--subtle)' }}>{entry.grade}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.category}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>{entry.updated_at?.slice(0, 10)}</span>
              </a>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {offset > 0 && (
              <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} className="btn btn-ghost btn-sm">Previous</button>
            )}
            <span style={{ fontSize: 12, color: 'var(--subtle)', alignSelf: 'center' }}>
              {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
            </span>
            {offset + LIMIT < total && (
              <button onClick={() => setOffset(offset + LIMIT)} className="btn btn-ghost btn-sm">Next</button>
            )}
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 32, padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Not on the list yet?</div>
          <p style={{ fontSize: 13, color: 'var(--subtle)', marginBottom: 14 }}>Scan your site for free and see how you rank against others.</p>
          <a href="/" className="btn btn-primary">Scan your site</a>
        </div>
      </div>

      <style>{`
        .leaderboard-row:hover { background: var(--surface) !important; }
        @media (max-width: 700px) {
          .leaderboard-row { grid-template-columns: 36px 1fr 60px 48px !important; }
          .leaderboard-row > :nth-child(5),
          .leaderboard-row > :nth-child(6) { display: none; }
        }
      `}</style>
    </div>
  )
}
