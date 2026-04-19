import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LandingPage } from './Landing.jsx'
import ScanResultsPage from './ScanResultsPage.jsx'
import { BlogListPage, BlogPostPage } from './Blog.jsx'
import { AboutPage } from './About.jsx'
import { RoadmapPage } from './Roadmap.jsx'
import { PricingPage } from './Pricing.jsx'
import { AuthModal } from './AuthModal.jsx'
import { InstallGuidePage } from './InstallGuide.jsx'
import { PrivacyPage } from './Privacy.jsx'
import { TermsPage } from './Terms.jsx'
import LeaderboardPage from './Leaderboard.jsx'
import ApiDocsPage from './ApiDocs.jsx'

// Simple path-based routing — no react-router needed
// /dashboard/  → dashboard app
// /scan/{domain} → scan results page (shareable)
// /leaderboard → AI readiness leaderboard
// /developers  → public API docs
// /             → landing page
// /blog         → blog list
// /blog/[slug]  → individual post
// /about        → about page
// /roadmap      → product roadmap
// /pricing      → pricing page
// /install      → platform install guide
// /auth/verify  → magic link callback (handled inside AuthModal on mount)
const path = window.location.pathname

function Root() {
  const [scanDomain, setScanDomain] = useState(() => {
    // Check if we're on a /scan/{domain} URL
    if (path.startsWith('/scan/')) return path.replace('/scan/', '').replace(/\/$/, '')
    return null
  })
  const [showAuth, setShowAuth] = useState(() => {
    // Auto-open auth modal if there's a magic link token in URL
    const params = new URLSearchParams(window.location.search)
    return params.has('token') ? 'login' : null
  })

  // For content pages — in-app navigation (no full page reload)
  const [contentPage, setContentPage] = useState(() => {
    if (path.startsWith('/blog/')) return { page: 'post', slug: path.replace('/blog/', '').replace(/\/$/, '') }
    if (path === '/blog' || path === '/blog/') return { page: 'blog' }
    if (path === '/about' || path === '/about/') return { page: 'about' }
    if (path === '/roadmap' || path === '/roadmap/') return { page: 'roadmap' }
    if (path === '/pricing' || path === '/pricing/') return { page: 'pricing' }
    if (path === '/install' || path === '/install/') return { page: 'install' }
    if (path === '/privacy' || path === '/privacy/') return { page: 'privacy' }
    if (path === '/terms' || path === '/terms/') return { page: 'terms' }
    if (path === '/leaderboard' || path === '/leaderboard/') return { page: 'leaderboard' }
    if (path === '/developers' || path === '/developers/') return { page: 'developers' }
    return null
  })

  const handleContentNavigate = (page, slug) => {
    setContentPage(slug ? { page, slug } : { page })
    window.scrollTo(0, 0)
    const newPath = slug ? `/${page}/${slug}` : `/${page}`
    window.history.pushState({}, '', newPath)
  }

  const handleAuthSuccess = (session) => {
    setShowAuth(null)
    // If they were redirected to upgrade, send them to pricing
    if (session && !session.js_enabled) {
      handleContentNavigate('pricing')
    }
  }

  // Dashboard app — full SPA
  if (path.startsWith('/dashboard')) {
    return <App />
  }

  // Content pages
  if (contentPage) {
    return (
      <>
        {showAuth && (
          <AuthModal
            initialMode={showAuth}
            onSuccess={handleAuthSuccess}
            onClose={() => setShowAuth(null)}
          />
        )}
        {contentPage.page === 'blog' && <BlogListPage onNavigate={handleContentNavigate} />}
        {contentPage.page === 'post' && <BlogPostPage slug={contentPage.slug} onNavigate={handleContentNavigate} />}
        {contentPage.page === 'about' && <AboutPage onNavigate={handleContentNavigate} />}
        {contentPage.page === 'roadmap' && <RoadmapPage onNavigate={handleContentNavigate} />}
        {contentPage.page === 'pricing' && (
          <PricingPage
            onNavigate={handleContentNavigate}
            onAuthRequired={({ redirectTo, plan } = {}) => setShowAuth('signup')}
          />
        )}
        {contentPage.page === 'install' && <InstallGuidePage onNavigate={handleContentNavigate} />}
        {contentPage.page === 'privacy' && <PrivacyPage onNavigate={handleContentNavigate} />}
        {contentPage.page === 'terms' && <TermsPage onNavigate={handleContentNavigate} />}
        {contentPage.page === 'leaderboard' && <LeaderboardPage onNavigate={handleContentNavigate} />}
        {contentPage.page === 'developers' && <ApiDocsPage onNavigate={handleContentNavigate} />}
      </>
    )
  }

  // Scan results page (shareable URL or post-scan)
  if (scanDomain) {
    return (
      <>
        {showAuth && (
          <AuthModal
            initialMode={showAuth}
            onSuccess={handleAuthSuccess}
            onClose={() => setShowAuth(null)}
          />
        )}
        <ScanResultsPage
          domain={scanDomain}
          onRegistered={() => setShowAuth('signup')}
          onNavigate={handleContentNavigate}
        />
      </>
    )
  }

  // Default: landing page
  return (
    <>
      {showAuth && (
        <AuthModal
          initialMode={showAuth}
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuth(null)}
        />
      )}
      <LandingPage
        onScanComplete={(domain) => {
          window.history.pushState({}, '', `/scan/${domain}`)
          setScanDomain(domain)
        }}
        onAuthRequired={() => setShowAuth('signup')}
      />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
