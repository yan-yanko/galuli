import { useState } from 'react'

// ── Platform guides ─────────────────────────────────────────────────────────
const GUIDES = {
  html: {
    name: 'Plain HTML', emoji: '🌐', difficulty: 'Easy',
    steps: [
      'Open your HTML file in a text editor.',
      'Find the closing </head> tag.',
      'Paste the snippet directly before </head>.',
      'Save and upload the file to your server.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  wordpress: {
    name: 'WordPress', emoji: '📝', difficulty: 'Easy',
    steps: [
      'Option A — Theme editor: Appearance → Theme File Editor → header.php. Find </head> and paste the snippet before it. Click Update File.',
      'Option B — Plugin (recommended): Install the free "Insert Headers and Footers" plugin. Go to Settings → Insert Headers and Footers → paste in "Scripts in Header" → Save.',
      'The snippet activates on the next page load.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  webflow: {
    name: 'Webflow', emoji: '🎨', difficulty: 'Easy',
    steps: [
      'Open your Webflow project.',
      'Click the gear icon to open Project Settings.',
      'Go to the Custom Code tab.',
      'Paste the snippet into the Head Code field.',
      'Click Save Changes, then Publish your site.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  shopify: {
    name: 'Shopify', emoji: '🛒', difficulty: 'Easy',
    steps: [
      'Go to Online Store → Themes.',
      'Click the three-dot menu on your active theme → Edit code.',
      'Open Layout → theme.liquid.',
      'Find the closing </head> tag and paste the snippet directly before it.',
      'Click Save.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  squarespace: {
    name: 'Squarespace', emoji: '⬛', difficulty: 'Easy',
    steps: [
      'Go to Settings → Advanced → Code Injection.',
      'Paste the snippet into the Header field.',
      'Click Save. Changes apply to all pages immediately.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  wix: {
    name: 'Wix', emoji: '🔵', difficulty: 'Easy',
    steps: [
      'In your Wix dashboard go to Settings → Custom Code.',
      'Click + Add Custom Code.',
      'Paste the snippet, set placement to Head, choose All Pages.',
      'Click Apply.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  framer: {
    name: 'Framer', emoji: '🖼️', difficulty: 'Easy',
    steps: [
      'Open your Framer project.',
      'Click the gear icon → Site Settings → General tab.',
      'Scroll to Custom Code → Start of head.',
      'Paste the snippet and click Publish.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  nextjs: {
    name: 'Next.js', emoji: '▲', difficulty: 'Medium',
    steps: [
      'Use next/script with strategy="afterInteractive" for optimal performance.',
      'App Router: add the Script component to app/layout.tsx (see code below).',
      'Pages Router: add a script tag to pages/_document.tsx inside Head.',
      'Replace YOUR_KEY with your API key from Dashboard → Snippet tab.',
      'Galuli auto-detects client-side route changes after deployment.',
    ],
    code: `// App Router — app/layout.tsx
import Script from 'next/script'
export default function RootLayout({ children }) {
  return (
    <html><body>
      {children}
      <Script
        src="https://galuli.io/galuli.js?key=YOUR_KEY"
        strategy="afterInteractive"
      />
    </body></html>
  )
}

// Pages Router — pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'
export default function Document() {
  return (
    <Html><Head>
      <script src="https://galuli.io/galuli.js?key=YOUR_KEY" async />
    </Head><body><Main /><NextScript /></body></Html>
  )
}`,
  },
  lovable: {
    name: 'Lovable / Base44', emoji: '💜', difficulty: 'Easy',
    steps: [
      'Open your project in Lovable or Base44.',
      'In the file explorer, open public/index.html.',
      'Find the closing </head> tag and paste the snippet before it.',
      'Save — Lovable hot-reloads automatically.',
      'v3.4.0 detects React Router navigation so every page is indexed, not just the landing page.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  replit: {
    name: 'Replit', emoji: '🔁', difficulty: 'Easy',
    steps: [
      'Open your Replit project.',
      'For HTML projects: open index.html and paste before </head>.',
      'For React projects: open public/index.html and paste before </head>.',
      'Click Run — Galuli detects SPA route changes automatically.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  react: {
    name: 'React / Vite', emoji: '⚛️', difficulty: 'Easy',
    steps: [
      'Create React App: open public/index.html.',
      'Vite: open index.html in the project root.',
      'Find </head> and paste the snippet before it.',
      'Save and restart your dev server.',
      'Galuli auto-detects pushState navigation — every route is indexed.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  ghost: {
    name: 'Ghost', emoji: '👻', difficulty: 'Easy',
    steps: [
      'Log in to your Ghost admin panel.',
      'Go to Settings → Code injection.',
      'Paste the snippet into the Site header field.',
      'Click Save.',
    ],
    code: '<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>',
  },
  cloudflare: {
    name: 'Cloudflare Worker', emoji: '🟠', difficulty: 'Medium',
    steps: [
      'Log in to the Cloudflare dashboard and select your domain.',
      'Go to Workers & Pages → Create → Create Worker. Give it a name (e.g. galuli-llms).',
      'Delete all default code and paste the Worker code below. Click Deploy.',
      'Go back to Workers & Pages → your worker → Settings → Triggers → Add route.',
      'Set the route to yourdomain.com/llms.txt and select your zone. Save.',
      'Visit yourdomain.com/llms.txt in your browser — it should return your AI registry. Done.',
    ],
    code: `// Cloudflare Worker — serves your Galuli AI registry at /llms.txt
// This makes your site discoverable by AI engines during real-time browsing,
// even if your site is a JavaScript SPA that AI crawlers can't render.

export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === '/llms.txt') {
      const registryUrl = \`https://galuli.io/registry/\${url.hostname}/llms.txt\`
      const response = await fetch(registryUrl)
      return new Response(await response.text(), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return fetch(request)
  },
}`,
  },
}

const PLATFORM_ORDER = [
  'html', 'wordpress', 'webflow', 'shopify', 'squarespace',
  'wix', 'framer', 'nextjs', 'lovable', 'replit', 'react', 'ghost', 'cloudflare',
]

const FAQ = [
  {
    q: 'How long until my site appears in the dashboard?',
    a: 'Within 60 seconds of the first page load after installing the snippet.',
  },
  {
    q: 'Does it slow down my site?',
    a: 'No. The script loads async and runs after page content. Typical overhead: under 5ms. It never blocks rendering.',
  },
  {
    q: 'Does it work on SPAs (React Router, Next.js app router)?',
    a: 'Yes. v3.4.0 automatically detects route changes via history.pushState patching and popstate events, and re-indexes on every navigation.',
  },
  {
    q: 'Can I install it on multiple domains?',
    a: "Yes, within your plan's site limit. Each domain registers automatically the first time it sends data — no manual setup needed.",
  },
  {
    q: 'What if I have a Content Security Policy (CSP)?',
    a: 'Add script-src https://galuli.io and connect-src https://galuli.io to your CSP header or meta tag.',
  },
  {
    q: "My key isn't working — what should I check?",
    a: 'Copy the full key from Dashboard → Snippet tab. Keys always start with cr_live_. Check for extra spaces or line breaks.',
  },
]

// ── Page component ──────────────────────────────────────────────────────────
export function InstallGuidePage({ onNavigate }) {
  const [selected, setSelected] = useState('html')
  const guide = GUIDES[selected]

  const nav = (page) => {
    if (onNavigate) onNavigate(page)
    else window.location.href = page === 'home' ? '/' : `/${page}`
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>

      {/* Nav */}
      <nav className="blog-nav glass-panel">
        <a href="/" className="blog-logo" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 22 }}>⬡</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>galuli</span>
        </a>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/about" onClick={e => { e.preventDefault(); nav('about') }} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}>About</a>
          <a href="/blog"  onClick={e => { e.preventDefault(); nav('blog')  }} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}>Blog</a>
          <a href="/dashboard/" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>Dashboard →</button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div className="blog-hero">
        <div className="badge badge-blue" style={{ marginBottom: 16 }}>⬡ Installation Guide</div>
        <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 16 }}>
          Install on Any Platform
        </h1>
        <p style={{ fontSize: 17, color: 'var(--subtle)', marginBottom: 24, lineHeight: 1.6 }}>
          One script tag. Works everywhere. Indexed in under 60 seconds.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', fontSize: 13, color: 'var(--subtle)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
          Get your API key from <strong style={{ color: 'var(--text)', marginLeft: 4 }}>Dashboard → Snippet</strong>&nbsp;tab first.
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 100px' }}>

        {/* Platform selector */}
        <div style={{ overflowX: 'auto', paddingBottom: 4, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
            {PLATFORM_ORDER.map(id => {
              const g = GUIDES[id]
              const active = selected === id
              return (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'rgba(94,106,210,0.15)' : 'var(--surface)',
                    color: active ? 'var(--accent2)' : 'var(--subtle)',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    whiteSpace: 'nowrap', transition: 'all 0.15s',
                  }}
                >
                  <span>{g.emoji}</span><span>{g.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Guide card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '28px 32px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 28 }}>{guide.emoji}</span>
            <span style={{ fontSize: 20, fontWeight: 600 }}>{guide.name}</span>
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
              padding: '3px 8px', borderRadius: 4,
              background: guide.difficulty === 'Easy' ? 'rgba(74,173,82,0.15)' : 'rgba(217,165,58,0.15)',
              color: guide.difficulty === 'Easy' ? 'var(--green)' : 'var(--yellow)',
              border: `1px solid ${guide.difficulty === 'Easy' ? 'rgba(74,173,82,0.3)' : 'rgba(217,165,58,0.3)'}`,
            }}>{guide.difficulty}</span>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Steps</div>
          <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {guide.steps.map((step, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(94,106,210,0.12)', border: '1px solid rgba(94,106,210,0.3)',
                  color: 'var(--accent2)', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                }}>{i + 1}</span>
                <span style={{ color: 'var(--subtle)', fontSize: 14, lineHeight: 1.6 }}>{step}</span>
              </li>
            ))}
          </ol>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Snippet to paste</div>
          <pre style={{ background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '14px 18px', overflowX: 'auto', margin: 0 }}>
            <code style={{ fontFamily: '"JetBrains Mono","Fira Code",monospace', fontSize: 13, color: 'var(--subtle)', lineHeight: 1.7, whiteSpace: 'pre' }}>{guide.code}</code>
          </pre>
        </div>

        {/* Verify */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '28px 32px', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>Verify It Is Working</div>
          {[
            <>Open DevTools (F12) → Console → type <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>window.galuli.version</code> — should return <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>'3.4.0'</code></>,
            <>Look for <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>[galuli] Initializing galuli v3.4.0</code> in the console. Add <code style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: 'var(--accent)' }}>?debug=1</code> to the script src for verbose logs.</>,
            <>Check your Galuli dashboard — your domain should appear within 60 seconds of the first page load.</>,
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i === 2 ? 0 : 14 }}>
              <span style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(74,173,82,0.12)', border: '1px solid rgba(74,173,82,0.3)',
                color: 'var(--green)', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
              }}>{i + 1}</span>
              <span style={{ color: 'var(--subtle)', fontSize: 14, lineHeight: 1.6 }}>{item}</span>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '28px 32px', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Frequently Asked Questions</div>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: i === FAQ.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{item.q}</div>
              <div style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.6 }}>{item.a}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ready to get indexed by AI?</div>
          <p style={{ color: 'var(--subtle)', fontSize: 14, marginBottom: 24 }}>
            Sign up free — your first domain is indexed within 60 seconds of installing the snippet.
          </p>
          <a href="/dashboard/" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary btn-lg">Go to Dashboard →</button>
          </a>
        </div>

      </div>
    </div>
  )
}
