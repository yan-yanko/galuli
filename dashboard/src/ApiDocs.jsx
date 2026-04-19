export default function ApiDocsPage({ onNavigate }) {
  const BASE = 'https://galuli.io'

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/score/{domain}',
      desc: 'AI Readiness Score (0-100) with grade, 3-dimension breakdown, and improvement suggestions.',
      example: `curl ${BASE}/api/v1/score/example.com`,
      response: `{
  "domain": "example.com",
  "total": 72,
  "grade": "B",
  "label": "Good AI Visibility",
  "dimensions": {
    "Entity Establishment": { "score": 28, "max": 35 },
    "Content Retrieval": { "score": 31, "max": 40 },
    "Freshness": { "score": 13, "max": 25 }
  },
  "suggestions": ["..."],
  "confidence": 0.82,
  "pages_crawled": 7
}`,
    },
    {
      method: 'GET',
      path: '/api/v1/geo/{domain}',
      desc: 'Per-AI-engine citation readiness scores for ChatGPT, Perplexity, Claude, Gemini, Grok, and Llama.',
      example: `curl ${BASE}/api/v1/geo/example.com`,
      response: `{
  "geo_total": 68,
  "geo_grade": "B",
  "llms": {
    "chatgpt": { "llm": "ChatGPT", "score": 14, "max": 20, "status": "needs_work", "recommendations": ["..."] },
    "claude": { "llm": "Claude", "score": 16, "max": 20, "status": "good", "recommendations": [] },
    ...
  },
  "top_recommendations": [{ "llm": "ChatGPT", "action": "..." }]
}`,
    },
    {
      method: 'GET',
      path: '/api/v1/leaderboard',
      desc: 'Ranked leaderboard of all scanned domains. Supports category filtering and pagination.',
      example: `curl "${BASE}/api/v1/leaderboard?category=Developer+Tools&limit=10"`,
      response: `{
  "entries": [
    { "rank": 1, "domain": "example.com", "score": 88, "grade": "A", "category": "Developer Tools" },
    ...
  ],
  "total": 247,
  "categories": ["Developer Tools", "E-commerce", "SaaS", ...]
}`,
    },
    {
      method: 'GET',
      path: '/registry/{domain}',
      desc: 'Full structured registry — capabilities, metadata, pricing, integrations, and AI metadata.',
      example: `curl ${BASE}/registry/example.com`,
      response: `{
  "domain": "example.com",
  "metadata": { "name": "Example", "category": "SaaS", "description": "..." },
  "capabilities": [{ "name": "...", "description": "...", "use_cases": [...] }],
  "pricing": { "model": "freemium", "tiers": [...] },
  "ai_metadata": { "confidence_score": 0.82, "pages_crawled": 7 }
}`,
    },
    {
      method: 'GET',
      path: '/api/v1/score/{domain}/badge',
      desc: 'Embeddable SVG badge showing the AI Readiness Score. Use as an <img> tag.',
      example: `<img src="${BASE}/api/v1/score/example.com/badge" alt="AI Readiness Score" />`,
      response: null,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav */}
      <nav style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}>
          <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 800 }}>g</div>
          galuli
        </a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/leaderboard" className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--subtle)' }}>Leaderboard</a>
          <a href="/pricing" className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--subtle)' }}>Pricing</a>
          <a href="/" className="btn btn-primary btn-sm">Scan your site</a>
        </div>
      </nav>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px 64px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>Public API</h1>
          <p style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.7 }}>
            All endpoints below are public and require no authentication. Rate limited to 30 requests/minute.
            For interactive docs, visit <a href="/docs" style={{ color: 'var(--accent)' }}>/docs</a>.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {endpoints.map((ep) => (
            <div key={ep.path} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(74,173,82,0.1)', border: '1px solid rgba(74,173,82,0.3)', color: 'var(--green)' }}>{ep.method}</span>
                <code style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{ep.path}</code>
              </div>
              <p style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6, marginBottom: 12 }}>{ep.desc}</p>
              <div style={{ marginBottom: ep.response ? 10 : 0 }}>
                <div className="label" style={{ marginBottom: 4 }}>{ep.path.includes('badge') ? 'Usage' : 'Example'}</div>
                <pre style={{ fontSize: 11, overflow: 'auto' }}>{ep.example}</pre>
              </div>
              {ep.response && (
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Response</div>
                  <pre style={{ fontSize: 11, overflow: 'auto', maxHeight: 240 }}>{ep.response}</pre>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Need higher rate limits or custom integrations?</div>
          <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 10 }}>
            The Agency plan ($199/mo) includes API access at 300 req/min with dedicated support.
          </p>
          <a href="/pricing" className="btn btn-primary btn-sm">See pricing</a>
        </div>
      </div>
    </div>
  )
}
