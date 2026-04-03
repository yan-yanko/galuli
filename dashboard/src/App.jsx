import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from './api'
import { ToastContainer } from './toast'
import { getPageFromHash } from './constants'
import { Nav } from './components'
import OverviewPage from './pages/OverviewPage'
import ScorePage from './pages/ScorePage'
import GeoPage from './pages/GeoPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ContentDoctorPage from './pages/ContentDoctorPage'
import CitationTrackerPage from './pages/CitationTrackerPage'
import SnippetPage from './pages/SnippetPage'
import SettingsPage from './pages/SettingsPage'
import IngestPage from './pages/IngestPage'
import RegistriesPage from './pages/RegistriesPage'
import TenantsPage from './pages/TenantsPage'
import './index.css'
import './App.css'

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(getPageFromHash)
  const [health, setHealth] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('galuli_theme') || 'light')
  const [pendingScanDomain, setPendingScanDomain] = useState(null)

  // Track which pages have ever been visited so they stay mounted (preserves their data/state)
  // useRef avoids triggering an extra re-render when we add a new page to the set
  const visitedRef = useRef(new Set([getPageFromHash()]))

  // Sync hash → page on back/forward navigation
  useEffect(() => {
    const onHashChange = () => {
      const p = getPageFromHash()
      visitedRef.current.add(p)
      setPage(p)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Wrapped setPage that also updates the URL hash and marks the page as visited
  const navigate = useCallback((p) => {
    window.location.hash = p
    visitedRef.current.add(p)
    setPage(p)
  }, [])

  // Apply theme class to <html> on mount + change
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') root.classList.add('light')
    else root.classList.remove('light')
    localStorage.setItem('galuli_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    api.health().then(setHealth).catch(() => { })
  }, [])

  // Helper: show/hide a page slot without unmounting it (preserves component state & fetched data)
  const show = (p) => ({ display: page === p ? undefined : 'none' })
  const v = visitedRef.current // alias for brevity

  return (
    <div className="app-shell">
      <Nav page={page} setPage={navigate} health={health} theme={theme} toggleTheme={toggleTheme} />
      <main className="main-content">
        {/* Lazy-mount + display:none: each page mounts on first visit and stays mounted.
            Switching tabs only toggles visibility — no unmount, no data loss, no re-fetch flash. */}
        {v.has('overview') && <div style={show('overview')}><OverviewPage setPage={navigate} setPendingScanDomain={setPendingScanDomain} /></div>}
        {v.has('score') && <div style={show('score')}><ScorePage pendingDomain={pendingScanDomain} clearPending={() => setPendingScanDomain(null)} /></div>}
        {v.has('geo') && <div style={show('geo')}><GeoPage /></div>}
        {v.has('analytics') && <div style={show('analytics')}><AnalyticsPage setPage={navigate} /></div>}
        {v.has('content-doctor') && <div style={show('content-doctor')}><ContentDoctorPage /></div>}
        {v.has('citations') && <div style={show('citations')}><CitationTrackerPage /></div>}
        {v.has('snippet') && <div style={show('snippet')}><SnippetPage /></div>}
        {v.has('settings') && <div style={show('settings')}><SettingsPage setPage={navigate} /></div>}
        {v.has('ingest') && <div style={show('ingest')}><IngestPage /></div>}
        {v.has('registries') && <div style={show('registries')}><RegistriesPage /></div>}
        {v.has('tenants') && <div style={show('tenants')}><TenantsPage /></div>}
      </main>
      <ToastContainer />
    </div>
  )
}
