import { useState, useEffect, useRef } from 'react'
import { GaluMascot } from './Galu.jsx'

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : window.location.origin

async function scanSite(url) {
  const res = await fetch(`${API_BASE}/api/v1/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': 'kotleryan1984' },
    body: JSON.stringify({ url, force_refresh: false, max_pages: 5 }),
  })
  if (!res.ok) throw new Error('Scan failed')
  return res.json()
}

async function pollJob(jobId) {
  const res = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`, {
    headers: { 'X-API-Key': 'kotleryan1984' },
  })
  if (!res.ok) throw new Error('Poll failed')
  return res.json()
}

async function getScore(domain) {
  const res = await fetch(`${API_BASE}/api/v1/score/${domain}`, {
    headers: { 'X-API-Key': 'kotleryan1984' },
  })
  if (!res.ok) throw new Error('Score not found')
  return res.json()
}

async function getRegistry(domain) {
  const res = await fetch(`${API_BASE}/registry/${domain}`, {
    headers: { 'X-API-Key': 'kotleryan1984' },
  })
  if (!res.ok) throw new Error('Registry not found')
  return res.json()
}

// ── Shared ────────────────────────────────────────────────────────────────────
export function ScoreRingLanding({ score, size = 80 }) {
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'
  const color = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--blue)' : score >= 40 ? 'var(--yellow)' : 'var(--red)'
  const r = size / 2 - 7
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.14, color: 'var(--subtle)', marginTop: 2 }}>{grade}</span>
      </div>
    </div>
  )
}

// ── Top nav (shared between landing + results) ─────────────────────────────
function LandingNav({ onSignIn }) {
  return (
    <nav style={{
      height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 64px', borderBottom: '1px solid var(--border)',
      background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15, color: 'var(--text)', textDecoration: 'none', letterSpacing: '-0.3px' }}>
        <div style={{ width: 22, height: 22, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 800, flexShrink: 0 }}>g</div>
        galuli
      </a>
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <a href="/blog"    className="btn btn-ghost btn-sm" style={{ color: 'var(--subtle)' }}>Blog</a>
        <a href="/about"   className="btn btn-ghost btn-sm" style={{ color: 'var(--subtle)' }}>About</a>
        <a href="/pricing" className="btn btn-ghost btn-sm" style={{ color: 'var(--subtle)' }}>Pricing</a>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--subtle)' }} onClick={() => onSignIn && onSignIn()}>Sign in</button>
        <a href="/pricing" className="btn btn-primary btn-sm" style={{ marginLeft: 6 }}>Join the beta →</a>
      </div>
    </nav>
  )
}

// ── Scan animation (terminal style) ──────────────────────────────────────────
function ScanAnimation({ url, progress }) {
  const steps = [
    { label: 'Crawling pages', threshold: 20 },
    { label: 'AI comprehension (4 passes)', threshold: 60 },
    { label: 'Extracting capabilities', threshold: 75 },
    { label: 'Calculating Score', threshold: 90 },
  ]
  const activeStep = steps.reduce((acc, s, i) => progress >= s.threshold ? i : acc, -1)
  const pagesFound = Math.floor((progress / 100) * 18)
  const logs = [
    { at: 5,  text: `GET /${url.replace(/https?:\/\//, '')} → 200` },
    { at: 12, text: 'Sitemap found · 18 URLs queued' },
    { at: 22, text: 'Crawled /about → 420 tokens' },
    { at: 35, text: 'Crawled /pricing → 318 tokens' },
    { at: 48, text: 'Pass 1/4 · Content extraction complete' },
    { at: 58, text: 'Pass 2/4 · Capability mapping complete' },
    { at: 66, text: 'Pass 3/4 · Structure analysis complete' },
    { at: 74, text: 'Pass 4/4 · Intent classification done' },
    { at: 82, text: '7 capabilities identified' },
    { at: 91, text: 'Computing AI Readiness Score…' },
  ].filter(l => l.at <= progress)

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', fontFamily: 'var(--font-mono)' }}>
      {/* Terminal bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
        {['#e5484d','#d9a53a','#4aad52'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--font)' }}>galuli scanner</div>
      </div>

      <div style={{ padding: '12px 14px 0' }}>
        {/* URL + pages */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600 }}>{url.replace(/https?:\/\//, '')}</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--subtle)' }}>{pagesFound} pages</div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--subtle)', marginBottom: 4 }}>
          <span>PROGRESS</span>
          <span style={{ color: 'var(--accent)' }}>{progress}%</span>
        </div>
        <div style={{ background: 'var(--border)', borderRadius: 3, height: 3, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent)', width: `${progress}%`, transition: 'width 0.8s ease' }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10, fontFamily: 'var(--font)' }}>
          {steps.map((s, i) => {
            const done = progress >= s.threshold
            const active = !done && i === activeStep + 1
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: done || active ? 1 : 0.3 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  background: done ? 'rgba(74,173,82,0.1)' : 'var(--surface2)',
                  border: `1px solid ${done ? 'rgba(74,173,82,0.3)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
                }}>
                  {done ? <span style={{ color: 'var(--green)' }}>✓</span>
                    : active ? <span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} />
                    : <span style={{ color: 'var(--subtle)' }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: 11, color: done ? 'var(--green)' : active ? 'var(--accent2)' : 'var(--muted)', fontWeight: done || active ? 500 : 400 }}>
                  {s.label}
                </span>
                {done && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--subtle)' }}>done</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Log output */}
      <div style={{ margin: '0 14px 12px', background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', height: 72, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2 }}>
        {logs.slice(-5).map((l, i) => (
          <div key={l.at} style={{ fontSize: 10, color: i === logs.slice(-5).length - 1 ? 'var(--accent2)' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <span style={{ color: 'var(--border2)', marginRight: 5 }}>›</span>{l.text}
          </div>
        ))}
        <div style={{ fontSize: 10, color: 'var(--accent)', animation: 'crawl-blink 1s step-end infinite' }}>▋</div>
      </div>
    </div>
  )
}

// ── Hero animation widget ─────────────────────────────────────────────────────
function HeroAnimation() {
  return (
    <div style={{ width: '100%', maxWidth: 520, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--accent), var(--accent2))' }} />
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Step 01 */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'white' }}>01</div>
            Your website
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>yourwebsite.com</div>
              <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 3 }}>12 pages · 4.2k words</div>
            </div>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 4px var(--green)' }} />
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={20} height={16} viewBox="0 0 20 16" fill="none">
            <line x1={10} y1={0} x2={10} y2={10} stroke="var(--border2)" strokeWidth={1.5} strokeDasharray="3 2" />
            <polyline points="5,8 10,14 15,8" stroke="var(--border2)" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Step 02 */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'white' }}>02</div>
            AI pipeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Content extraction',   color: 'var(--accent)',  delay: '0s'    },
              { label: 'Capability mapping',    color: 'var(--blue)',    delay: '0.3s'  },
              { label: 'Structure analysis',    color: 'var(--purple)',  delay: '0.6s'  },
              { label: 'Intent classification', color: 'var(--green)',   delay: '0.9s'  },
            ].map(({ label, color, delay }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div className="animate-aipass" style={{ height: '100%', borderRadius: 2, background: color, animationDelay: delay }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--subtle)', width: 140 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={20} height={16} viewBox="0 0 20 16" fill="none">
            <line x1={10} y1={0} x2={10} y2={10} stroke="var(--border2)" strokeWidth={1.5} strokeDasharray="3 2" />
            <polyline points="5,8 10,14 15,8" stroke="var(--border2)" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Step 03 — Score */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'white' }}>03</div>
            AI Readiness Score
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px 16px' }}>
            <ScoreRingLanding score={78} size={68} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Ready for AI</div>
              {[
                { d: 'Content',   v: 85, c: 'var(--accent)' },
                { d: 'Structure', v: 72, c: 'var(--blue)' },
                { d: 'WebMCP',    v: 40, c: 'var(--yellow)' },
              ].map(({ d, v, c }) => (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ fontSize: 11, color: 'var(--subtle)', width: 56 }}>{d}</div>
                  <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: c, borderRadius: 2, width: `${v}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--subtle)', width: 22, textAlign: 'right' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { q: "Why does AI accessibility matter for my website?", a: "AI search (ChatGPT, Perplexity, Claude, Gemini) now handles billions of queries daily and is on track to route $750 billion through AI-mediated commerce by 2028. Traffic from AI systems converts at 14.2% vs 2.8% for traditional search — 5x higher — because users arrive with specific intent after AI has already validated your solution. Traditional search traffic is projected to decline 25% by 2026 as AI answers replace blue links." },
  { q: "What is GEO — Generative Engine Optimization?", a: "GEO is the discipline of making your website readable and citable by AI systems like ChatGPT, Claude, Perplexity, and Gemini. Traditional SEO gets you ranked in Google. GEO gets you cited in AI answers. Research from Princeton's GEO-bench shows that adding statistics and citations to content increases AI citation probability by 30–40%. Galuli automates everything GEO requires: structured signals, llms.txt, schema markup, freshness, and authority." },
  { q: "Which AI systems does Galuli optimize for?", a: "Six: ChatGPT (OpenAI), Perplexity, Claude (Anthropic), Gemini (Google), Grok (xAI), and Llama (Meta / open-source). Each weights different signals differently. Galuli gives you an AI Readiness Score across all of them so you know exactly which systems you're underperforming on and why." },
  { q: "What is an AI Readiness Score?", a: "A 0–100 score across 5 dimensions: Content Coverage, Structural Quality (schema markup, formatting), Machine-Readable Signals (llms.txt, robots.txt, WebMCP), Authority, and Freshness. 76.4% of pages cited by AI engines were updated within the past 30 days — freshness matters more than most people realize. Each dimension is scored independently so you know exactly where to improve." },
  { q: "What is llms.txt and do I need one?", a: "llms.txt is a Markdown file at /llms.txt on your domain that summarizes your site specifically for AI language models. Without it, AI systems infer your product from marketing copy, which leads to incomplete or inaccurate representations. Galuli generates yours automatically from your crawled site data." },
  { q: "What is WebMCP?", a: "WebMCP (Web Multi-agent Communication Protocol) is an emerging standard for registering your service capabilities with AI agent frameworks. When registered, AI agents can discover and interact with your tools directly. Galuli handles registration automatically when you install the snippet." },
  { q: "How does AI agent analytics work?", a: "AI crawlers don't execute JavaScript, so they never appear in Google Analytics. Galuli's snippet detects AI-specific request patterns and correlates them with server-side signals to give you visibility into which AI systems are reading your site, which pages they visit, and how that traffic trends over time." },
  { q: "What is Content Doctor?", a: "Content Doctor is Galuli's AI-powered content audit. It runs three analyses: the Authority Gap Scanner identifies claims AI systems won't trust (statistics without sources, benefits without evidence). The Information Gain Checker flags generic content that adds no unique value — AI engines skip content they already know. The Structural Optimizer finds dense paragraphs, missing Key Takeaways, and schema gaps that hurt AI readability." },
  { q: "Why is my robots.txt blocking AI traffic?", a: "Many sites accidentally block AI crawlers (GPTBot, ClaudeBot, PerplexityBot) via overly broad robots.txt rules. This means AI search engines literally cannot read your site and will never cite you. Galuli's AI Readiness Score flags this as a critical issue and tells you exactly which crawlers are blocked." },
  { q: "Is Galuli free?", a: "Yes — the free tier lets you scan any site instantly with no credit card required. You get the full AI Readiness Score, robots.txt audit, schema.org audit, and AI agent analytics. Starter plan ($9/month) adds Content Doctor, continuous monitoring, and auto-refresh. Pro ($29/month) covers unlimited sites." },
  { q: "How is Galuli different from SEMrush or Ahrefs?", a: "SEMrush and Ahrefs measure traditional search visibility — keyword rankings, backlinks, organic Google traffic. Galuli measures AI accessibility — how AI systems understand, trust, and cite your content. These are complementary. You can have a top Google ranking and zero AI visibility, or a small site that gets cited constantly by ChatGPT." },
]

function FaqAccordion() {
  const [open, setOpen] = useState(null)
  return (
    <div>
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: '100%', textAlign: 'left', padding: '14px 0', background: 'none',
                border: 'none', cursor: 'pointer', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', gap: 14,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>{item.q}</span>
              <span style={{ fontSize: 16, color: 'var(--subtle)', flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>+</span>
            </button>
            {isOpen && (
              <div style={{ paddingBottom: 14, fontSize: 15, color: 'var(--subtle)', lineHeight: 1.7, animation: 'fadeSlideUp 0.15s ease forwards' }}>
                {item.a}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export function LandingPage({ onScanComplete, onAuthRequired }) {
  const [url, setUrl] = useState('')
  const [stage, setStage] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const STAGES = ['Crawling your pages…','Running AI analysis (4 passes)…','Extracting capabilities…','Calculating AI Readiness Score…','Almost done…']

  const handleScan = async (e) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    const fullUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    setStage('scanning'); setProgress(0); setError('')
    try {
      const job = await scanSite(fullUrl)
      const domain = job.domain
      const finishScan = async (domain) => {
        setProgress(95)
        const [score, registry] = await Promise.all([
          getScore(domain).catch(() => ({ total: 0, grade: 'F', label: 'Not scored yet', dimensions: {}, suggestions: [] })),
          getRegistry(domain).catch(() => ({ capabilities: [], metadata: {} })),
        ])
        setProgress(100); setStage('done')
        onScanComplete({ domain, score, registry })
      }
      if (job.status === 'complete') { await finishScan(domain); return }
      let stageIdx = 0, fakeProgress = 8
      const startedAt = Date.now()
      const TIMEOUT_MS = 90000 // 90 seconds max wait
      const interval = setInterval(async () => {
        try {
          // Timeout guard — surface a friendly error if crawl stalls
          if (Date.now() - startedAt > TIMEOUT_MS) {
            clearInterval(interval)
            setStage('error')
            setError('The scan is taking longer than expected. The site may be slow to respond — try again in a moment.')
            return
          }
          const updated = await pollJob(job.job_id)
          // Progress targets per stage — crawling reaches 35 fast (5-page scan is quick)
          const targetProgress = { crawling: 35, comprehending: 72, storing: 90 }[updated.status] || fakeProgress
          fakeProgress = Math.min(fakeProgress + 4, targetProgress)
          setProgress(Math.round(fakeProgress))
          const newStageIdx = { crawling: 0, comprehending: 1, storing: 3 }[updated.status] ?? stageIdx
          if (newStageIdx !== stageIdx) { stageIdx = newStageIdx }
          if (updated.status === 'complete') { clearInterval(interval); await finishScan(domain) }
          else if (updated.status === 'failed') { clearInterval(interval); throw new Error(updated.error || 'Scan failed') }
        } catch (err) { clearInterval(interval); setStage('error'); setError(err.message || 'Scan error') }
      }, 1200)
    } catch (err) { setStage('error'); setError(err.message || 'Scan failed') }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <LandingNav onSignIn={onAuthRequired} />

      {/* ── Hero ── */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '80px 64px 72px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,560px)', gap: 80, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <div className="badge badge-purple" style={{ fontSize: 11 }}>
                Private Beta
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>· Limited access · Yan reviews each signup personally</div>
            </div>
            <h1 style={{ fontSize: 'clamp(42px, 5.5vw, 72px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 22, color: 'var(--text)' }}>
              Make your website<br />
              <span style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>readable by AI.</span>
            </h1>
            <p style={{ fontSize: 18, color: 'var(--subtle)', lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
              Billions of people now get answers from ChatGPT, Claude, and Perplexity instead of clicking links. If AI can't read your site, you don't exist to them. Galuli makes your site fully accessible to every AI system — with one line of code.
            </p>

            {/* Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {[
                { label: 'Effortless.', detail: 'One script tag. Galuli handles everything else automatically.' },
                { label: 'Beta access.', detail: 'Scan your site free. Yan reviews every signup and will reach out personally.' },
                { label: 'Universal.', detail: 'ChatGPT, Claude, Perplexity, Gemini, Grok — all of them, at once.' },
              ].map(({ label, detail }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 800, fontSize: 10, flexShrink: 0, marginTop: 1 }}>✓</div>
                  <span><strong style={{ color: 'var(--text)', fontWeight: 600 }}>{label}</strong>{' '}<span style={{ color: 'var(--subtle)' }}>{detail}</span></span>
                </div>
              ))}
            </div>

            {/* Scan form */}
            {stage === 'idle' && (
              <form onSubmit={handleScan} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 480 }}>
                <input
                  ref={inputRef}
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="yourwebsite.com"
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button type="submit" className="btn btn-primary">Scan my site free →</button>
              </form>
            )}
            {stage === 'error' && (
              <div>
                <div style={{ background: 'rgba(229,72,77,0.08)', border: '1px solid rgba(229,72,77,0.3)', borderRadius: 6, padding: '10px 14px', color: 'var(--red)', marginBottom: 10, fontSize: 13 }}>{error}</div>
                <button onClick={() => setStage('idle')} className="btn btn-ghost btn-sm">Try again</button>
              </div>
            )}
            {stage === 'scanning' && (
              <div style={{ maxWidth: 480 }}>
                <ScanAnimation url={url} progress={progress} />
              </div>
            )}
            <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 10 }}>Free scan · No account needed · Yan will reach out after you join</p>
          </div>

          {/* Right — hero animation */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <HeroAnimation />
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '20px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, textAlign: 'center' }}>
          {[
            { number: '14.2%', label: 'AI traffic conversion rate', sub: 'vs 2.8% traditional search' },
            { number: '$750B', label: 'AI-mediated commerce by 2028', sub: 'Gartner estimate' },
            { number: '30–40%', label: 'more AI citations', sub: 'by adding stats — Princeton GEO-bench' },
            { number: '76.4%', label: 'of AI-cited pages', sub: 'updated in the last 30 days' },
          ].map(({ number, label, sub }) => (
            <div key={number}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{number}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 3 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust strip ── */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '14px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Visible to</span>
          {['ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Grok', 'Llama', 'WebMCP Agents'].map(name => (
            <span key={name} style={{ fontSize: 13, color: 'var(--subtle)', fontWeight: 500 }}>{name}</span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <div className="eyebrow">How it works</div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>AI accessibility in three steps</h2>
          <p style={{ fontSize: 16, color: 'var(--subtle)' }}>From zero to fully AI-readable in under 5 minutes</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 1, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--border)' }}>
          {[
            { step: '01', title: 'See your AI readability score', desc: 'Enter your URL. Galuli crawls every page, runs a 4-pass AI comprehension pipeline, and tells you exactly how well each LLM can read and understand your site — in under 2 minutes.' },
            { step: '02', title: 'Add one script tag', desc: 'Copy one line into your site\'s <head>. Galuli auto-generates your llms.txt, registers your capabilities with WebMCP, and starts tracking which AI systems visit you.', tag: '30 seconds to install' },
            { step: '03', title: 'Every AI can read you now', desc: 'ChatGPT, Claude, Perplexity, Gemini, Grok — they can all read, understand, and cite your site. Your readability score updates automatically as your content changes.' },
          ].map(({ step, title, desc, tag }) => (
            <div key={step} style={{ background: 'var(--surface)', padding: '24px 24px 20px', position: 'relative' }}>
              {tag && <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, background: 'rgba(94,106,210,0.1)', border: '1px solid rgba(94,106,210,0.25)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 3, fontWeight: 600 }}>{tag}</div>}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Step {step}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--text)', letterSpacing: '-0.2px' }}>{title}</div>
              <p style={{ fontSize: 15, color: 'var(--subtle)', lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <div className="eyebrow">What's included</div>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>Everything AI needs<br />to read your site.</h2>
            <p style={{ fontSize: 16, color: 'var(--subtle)' }}>One script tag. Every feature activates automatically — no config, no backend changes.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--border)' }}>
            {[
              { title: 'AI Readability Score',             desc: 'A 0–100 score across 5 dimensions: content clarity, structure, machine signals, authority, and freshness. 76.4% of AI-cited pages were updated in the last 30 days — we track all of it.', color: 'var(--accent)' },
              { title: 'llms.txt + AI Plugin Manifest',    desc: 'Auto-generates /llms.txt and /.well-known/ai-plugin.json — the files AI systems check first. Without them, LLMs guess your content from scraped HTML.', color: 'var(--green)' },
              { title: 'robots.txt + Schema.org Audit',    desc: 'Many sites accidentally block GPTBot, ClaudeBot, and PerplexityBot. We check your robots.txt, flag blocked crawlers, and audit your schema.org markup — Organization, FAQPage, HowTo.', color: 'var(--yellow)' },
              { title: 'Content Doctor',                   desc: 'Finds authority gaps (claims without citations) AND information gain deficits (generic content AI already knows). Returns specific rewrites — Princeton research shows +30–40% citation boost from this.', color: 'var(--blue)' },
              { title: 'AI Traffic Analytics',             desc: 'See which AI crawlers visit your site, which pages they read, how deep they go, and how that changes over time. Invisible to Google Analytics — visible to Galuli.', color: 'var(--red)' },
              { title: 'WebMCP + Auto-refresh',            desc: 'Registers your capabilities as callable tools in AI agent frameworks. Content change detection re-indexes automatically — AI systems always see your latest version.', color: 'var(--purple)' },
            ].map(({ title, desc, color }) => (
              <div key={title} style={{ background: 'var(--surface)', padding: '20px 22px' }}>
                <div style={{ width: 3, height: 16, background: color, borderRadius: 2, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>{title}</div>
                <div style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── What is AI Readability ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 32px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 56, alignItems: 'start' }}>
          <div>
            <div className="eyebrow">Why AI accessibility matters</div>
            <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 16, lineHeight: 1.1 }}>
              Google reads HTML.<br />AI reads meaning.
            </h2>
            <p style={{ color: 'var(--subtle)', fontSize: 16, lineHeight: 1.8, marginBottom: 14 }}>
              SEO gets you ranked in Google. AI accessibility is different — and more urgent. LLMs like ChatGPT and Claude need to <em style={{ color: 'var(--text)', fontStyle: 'normal', fontWeight: 600 }}>understand</em> what your site does, who it's for, and what actions are possible. If they can't, they skip you entirely.
            </p>
            <p style={{ color: 'var(--subtle)', fontSize: 16, lineHeight: 1.8 }}>
              Galuli extracts your site's capabilities into structured formats every AI understands — llms.txt, ai-plugin.json, WebMCP — without touching a single line of your backend code.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { term: 'llms.txt + ai-plugin.json', color: 'var(--accent)',  desc: 'The files AI systems check before reading your homepage. Without them, LLMs infer your product from scraped marketing copy — and get it wrong.' },
              { term: 'robots.txt audit',          color: 'var(--yellow)',  desc: 'GPTBot, ClaudeBot, PerplexityBot — your robots.txt may be blocking them right now. Galuli detects this and flags it as a critical issue.' },
              { term: 'Schema.org audit',          color: 'var(--green)',   desc: 'FAQPage, Organization, HowTo schema makes you 3x more likely to be cited by AI. We detect what you have and what\'s missing.' },
              { term: 'Content Doctor',            color: 'var(--blue)',    desc: 'Authority gaps + information gain deficits. Not vague advice — specific rewrites based on Princeton\'s GEO-bench research.' },
            ].map(({ term, color, desc }) => (
              <div key={term} style={{ borderLeft: `2px solid ${color}`, paddingLeft: 14, paddingTop: 4, paddingBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 3 }}>{term}</div>
                <div style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Score scale ── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <div className="eyebrow">AI Readability Score</div>
            <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>How readable are you to AI?</h2>
            <p style={{ fontSize: 16, color: 'var(--subtle)' }}>0–100. Every point reflects how well LLMs can actually read, parse, and trust your content.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {[
              { range: '90–100', grade: 'A+', color: 'var(--green)',  pct: 100, label: 'Fully AI-readable',      desc: 'Every LLM can read, parse, and cite your site with confidence.' },
              { range: '70–89',  grade: 'B',  color: 'var(--blue)',   pct: 80,  label: 'Mostly readable',          desc: 'AI systems understand you well. A few gaps hold you back from full coverage.' },
              { range: '50–69',  grade: 'C',  color: 'var(--yellow)', pct: 60,  label: 'Partially readable',       desc: 'AI can reach you but misses capabilities and context. Common for unoptimized sites.' },
              { range: '30–49',  grade: 'D',  color: 'var(--red)',    pct: 40,  label: 'Hard to parse',            desc: 'LLMs struggle to understand your site. High risk of being skipped or misrepresented.' },
              { range: '0–29',   grade: 'F',  color: 'var(--subtle)', pct: 20,  label: 'Not readable — invisible', desc: 'AI systems cannot understand your site. One script tag changes everything.' },
            ].map(({ range, grade, color, pct, label, desc }, i) => (
              <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', background: 'var(--surface)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: color === 'var(--muted)' ? 'var(--surface2)' : `${color}15`, border: `1px solid ${color === 'var(--muted)' ? 'var(--border)' : `${color}30`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color, fontSize: 13, flexShrink: 0 }}>{grade}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{label}</span>
                    <span style={{ fontSize: 12, color: 'var(--subtle)', flexShrink: 0, marginLeft: 10 }}>{range}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 3, height: 3, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtle)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <div className="eyebrow">FAQ</div>
          <h2 style={{ fontSize: 'clamp(26px, 2.8vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>Questions we get asked a lot</h2>
        </div>
        <FaqAccordion />
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '64px 32px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div className="badge badge-purple" style={{ fontSize: 11, marginBottom: 16, display: 'inline-block' }}>Private Beta</div>
          <h2 style={{ fontSize: 'clamp(30px, 3.5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12, color: 'var(--text)', lineHeight: 1.1 }}>Is your site readable by AI?</h2>
          <p style={{ fontSize: 17, color: 'var(--subtle)', marginBottom: 28 }}>Free scan. See your AI Readiness Score in 60 seconds. Yan will reach out personally after you join.</p>
          <form onSubmit={handleScan} style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="yourwebsite.com" style={{ flex: 1, minWidth: 200, maxWidth: 300 }} />
            <button type="submit" className="btn btn-primary">Scan my site →</button>
          </form>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
          <div style={{ width: 18, height: 18, background: 'var(--accent)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 800 }}>g</div>
          galuli
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {[['Pricing', '/pricing'], ['Blog', '/blog'], ['About', '/about'], ['Roadmap', '/roadmap']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'none' }}>{label}</a>
          ))}
          <a href="mailto:hello@galuli.io" style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'none' }}>hello@galuli.io</a>
          <span style={{ fontSize: 12, color: 'var(--subtle)' }}>© 2025 Galuli</span>
        </div>
        <a href="/dashboard/" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Dashboard →</a>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ── Results Page ──────────────────────────────────────────────────────────────
export function ResultsPage({ data, onRegistered }) {
  const { domain, score: rawScore } = data
  const score = { total: 0, grade: 'F', label: 'Poor AI Visibility', dimensions: {}, suggestions: [], ...rawScore }

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emailDone, setEmailDone] = useState(() => !!localStorage.getItem('galuli_user'))
  const [copied, setCopied] = useState(false)

  const gradeColor = score.total >= 70 ? 'var(--green)' : score.total >= 50 ? 'var(--yellow)' : 'var(--red)'
  const badgeUrl = `${API_BASE}/api/v1/score/${domain}/badge`
  const badgeCode = `<a href="https://galuli.io" title="AI Readiness Score">\n  <img src="${badgeUrl}" alt="Galuli AI Readiness Score" />\n</a>`

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // Derive a name from the email (e.g. "jane" from "jane@company.com")
      const derivedName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Beta user'
      const res = await fetch(`${API_BASE}/api/v1/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: derivedName, email: email.trim(), plan: 'free', password: null }),
      })
      const data = await res.json()
      // Accept both success and "already exists" as OK — user is in the system either way
      if (res.ok) {
        localStorage.setItem('galuli_api_key', data.api_key)
        localStorage.setItem('galuli_email', data.email)
        localStorage.setItem('galuli_name', data.name)
        localStorage.setItem('galuli_plan', data.plan || 'free')
      }
    } catch (_) {
      // Fail silently — still show the thank-you (email was captured if the request went through)
    } finally {
      localStorage.setItem('galuli_user', JSON.stringify({ email, registered_at: new Date().toISOString() }))
      setEmailDone(true)
      setSubmitting(false)
    }
  }

  const DIM_COLORS = {
    'Content Coverage': 'var(--accent)',
    'Structure Quality': 'var(--blue)',
    'Machine Signals': 'var(--purple)',
    'Authority': 'var(--green)',
    'Freshness': 'var(--yellow)',
  }
  const fallbackDims = {
    'Content Coverage': { score: 0, max: 25 },
    'Structure Quality': { score: 0, max: 20 },
    'Machine Signals':   { score: 0, max: 20 },
    'Authority':         { score: 0, max: 20 },
    'Freshness':         { score: 0, max: 15 },
  }
  const dims = Object.keys(score.dimensions || {}).length > 0 ? score.dimensions : fallbackDims

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Nav */}
      <nav style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, color: 'var(--text)', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
          <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 800 }}>g</div>
          galuli
        </div>
        <div style={{ fontSize: 13, color: 'var(--subtle)' }}>
          AI Readiness Report · <strong style={{ color: 'var(--text)' }}>{domain}</strong>
        </div>
        <button onClick={() => onRegistered && onRegistered()} className="btn btn-primary btn-sm">Open Dashboard →</button>
      </nav>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Score hero */}
        <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', borderColor: `${gradeColor}30` }}>
          <ScoreRingLanding score={score.total} size={100} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>AI Readiness Score</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.3px' }}>{score.label}</div>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 10 }}>{domain}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-blue">Score: {score.total}/100</span>
              <span className="badge" style={{ color: gradeColor, border: `1px solid ${gradeColor}40`, background: `${gradeColor}12` }}>Grade: {score.grade}</span>
              {score.total >= 70 && <span className="badge badge-green">✓ AI-Ready</span>}
              {score.total < 40 && <span className="badge badge-yellow">⚠ Needs Work</span>}
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16 }}>Score breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(dims).map(([key, dim]) => {
              const pct = dim.max > 0 ? (dim.score / dim.max) * 100 : 0
              const color = DIM_COLORS[key] || 'var(--accent)'
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 500 }}>{key}</span>
                    <span style={{ color: 'var(--subtle)' }}>{dim.score}/{dim.max}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 3, height: 4 }}>
                    <div style={{ height: 4, borderRadius: 3, background: color, width: `${pct}%`, transition: 'width 1s ease 0.3s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Suggestions */}
        {score.suggestions?.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Top improvements</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {score.suggestions.map((tip, i) => {
                const text = typeof tip === 'string' ? tip : (tip?.issue || tip?.fix || '')
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{i + 1}</div>
                    <div style={{ fontSize: 12, color: 'var(--subtle)', lineHeight: 1.6, paddingTop: 1 }}>{text}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Locked features */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>What Starter unlocks</div>
            <span className="badge badge-purple">from $9/mo</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { title: 'AI Attention Score', desc: 'See how much attention each AI system pays to your site.', locked: true },
              { title: 'Content Doctor', desc: 'Find claims AI won\'t trust with specific rewrites.', locked: true },
              { title: 'Continuous Monitoring', desc: 'Every page change triggers an automatic rescan.', locked: true },
              { title: 'Embeddable Badge', desc: 'Show visitors you\'re AI-ready. Always live, always accurate.', locked: !emailDone },
            ].map(({ title, desc, locked }) => (
              <div key={title} style={{ position: 'relative', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', padding: '14px', overflow: 'hidden' }}>
                {locked && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,14,16,0.85)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, zIndex: 2 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, marginBottom: 3 }}>🔒</div>
                      <div style={{ fontSize: 10, color: 'var(--subtle)', fontWeight: 600 }}>Starter plan</div>
                    </div>
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, color: 'var(--text)' }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {!emailDone ? (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(94,106,210,0.25)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.2px' }}>Join the beta</div>
              <div className="badge badge-purple" style={{ fontSize: 10 }}>Private Beta</div>
            </div>
            <p style={{ color: 'var(--subtle)', fontSize: 12, lineHeight: 1.7, marginBottom: 16, maxWidth: 440 }}>
              Drop your email and Yan (the founder) will reach out personally to get you set up. Free, no credit card.
            </p>
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required style={{ flex: 1, minWidth: 200 }} />
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Joining…</> : 'Join the beta →'}
              </button>
            </form>
            <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 10 }}>Free · No credit card · Yan reviews every signup</p>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(74,173,82,0.25)' }}>
            <GaluMascot size={56} mood="celebrate" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, letterSpacing: '-0.2px' }}>You're on the list!</div>
            <p style={{ color: 'var(--subtle)', fontSize: 13, lineHeight: 1.7, marginBottom: 14, maxWidth: 420 }}>
              Yan will reach out to you at <strong style={{ color: 'var(--text)' }}>{email}</strong> personally — usually within a day.
              In the meantime, your dashboard is ready to explore.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => onRegistered && onRegistered()} className="btn btn-primary">Open Dashboard →</button>
            </div>
          </div>
        )}

        {/* Badge */}
        <div className="card" style={{ marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          {!emailDone && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,14,16,0.88)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, borderRadius: 'inherit' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>🔒</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>Embeddable Score Badge</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Create a free account to unlock</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Embed your score badge</div>
              <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 12, maxWidth: 340 }}>Show visitors your site is AI-ready. Updates automatically.</p>
              <img src={badgeUrl} alt="AI Readiness Score badge" style={{ display: 'block', marginBottom: 12, borderRadius: 6 }} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="label">HTML snippet</div>
              <pre style={{ marginBottom: 8, fontSize: 11 }}>{badgeCode}</pre>
              <button onClick={() => { navigator.clipboard.writeText(badgeCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }} className="btn btn-ghost btn-sm">
                {copied ? '✓ Copied' : 'Copy snippet'}
              </button>
            </div>
          </div>
        </div>

        {/* Install snippet */}
        {emailDone && (
          <div className="card" style={{ borderColor: 'rgba(94,106,210,0.25)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Start monitoring {domain}</div>
            <p style={{ color: 'var(--subtle)', fontSize: 12, marginBottom: 14 }}>Paste this in your site's &lt;head&gt;. Galuli generates your llms.txt, registers WebMCP, and tracks AI agent visits.</p>
            <div className="code-block" style={{ marginBottom: 12 }}>
              {`<script src="${API_BASE}/galuli.js" defer></script>`}
            </div>
            <button onClick={() => onRegistered && onRegistered()} className="btn btn-primary">Go to Dashboard →</button>
          </div>
        )}
      </div>
    </div>
  )
}
