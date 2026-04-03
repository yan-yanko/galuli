import { toast } from './toast'

// ── Sidebar Navigation ───────────────────────────────────────────────────────
export const NAV_SECTIONS = [
  {
    label: 'SETUP',
    items: [
      {
        id: 'snippet', label: 'Install Snippet', icon: '\u27E8\u27E9',
        tooltip: 'Get your API key and paste one script tag into your site\'s <head>. Activates AI tracking, llms.txt generation, WebMCP, and auto-indexing.',
      },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { id: 'overview',  label: 'Overview',   icon: '\u229E', tooltip: 'Your AI accessibility dashboard \u2014 scan sites, track scores, and monitor overall progress.' },
      { id: 'score',     label: 'AI Score',   icon: '\u25CE', tooltip: '0\u2013100 AI Visibility Score. Built on The Stack: Entity Establishment (L1, 35pts), Content Retrieval (L4, 40pts), Freshness (25pts).' },
      { id: 'geo',       label: 'GEO',        icon: '\u25C8', tooltip: 'Generative Engine Optimization \u2014 per-LLM citation readiness score for ChatGPT, Claude, Perplexity, Gemini, Grok, and Llama.' },
      { id: 'analytics', label: 'Analytics',  icon: '\u2197', tooltip: 'AI agent traffic analytics \u2014 which LLMs crawl your site, which pages they read, and how traffic trends over time.' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { id: 'content-doctor', label: 'Content Doctor', icon: '\u2726', highlight: true, tooltip: 'Authority gap scanner + information gain analysis. Returns specific rewrites that increase AI citation probability by 30\u201340% (Princeton GEO-bench).' },
      { id: 'citations',      label: 'Citations',      icon: '\u25C9', tooltip: 'Track whether ChatGPT, Perplexity, and Claude cite your site in their answers. Requires Pro plan.' },
    ],
  },
]

// ── Analytics constants ──────────────────────────────────────────────────────
export const AGENT_COLORS = {
  'GPTBot': '#10b981', 'ChatGPT': '#10b981', 'OpenAI Search': '#10b981',
  'ClaudeBot': '#f59e0b', 'Claude Web': '#f59e0b', 'Anthropic': '#f59e0b',
  'PerplexityBot': '#3b82f6', 'Perplexity': '#3b82f6',
  'Gemini': '#8b5cf6', 'Google Extended': '#8b5cf6',
  'BingBot': '#06b6d4', 'WebMCP Agent': '#ec4899',
}

export const TREND_ICON = { growing: '\u2191', stable: '\u2192', declining: '\u2193' }
export const TREND_COLOR = { growing: 'var(--green)', stable: 'var(--muted)', declining: 'var(--red)' }

// ── Lemon Squeezy checkout URLs ──────────────────────────────────────────────
export const LS_URLS = {
  starter:        'https://galuli.io/checkout/buy/8bc3ebee-b31d-43ee-bbcc-5b47ba3b0022',
  starter_annual: null, // TODO: paste Starter $79/yr checkout URL here
  pro:            'https://galuli.io/checkout/buy/e280dc25-998e-4ca5-b224-5d6548d8f4e0',
  pro_annual:     null, // TODO: paste Pro $249/yr checkout URL here
}

export function openCheckout(plan, email) {
  const base = LS_URLS[plan]
  if (!base) {
    toast.info('Annual plans are coming soon \u2014 email hello@galuli.io to get early access pricing.')
    return
  }
  const url = email ? `${base}?checkout[email]=${encodeURIComponent(email)}` : base
  window.open(url, '_blank', 'noopener')
}

// ── Plan display details ─────────────────────────────────────────────────────
export const PLAN_DETAILS = {
  free:       { label: 'Free',       color: 'var(--muted)',   price: '$0/mo',   sites: '3 sites',    rate: '10 req/min' },
  starter:    { label: 'Starter',    color: 'var(--green)',   price: '$29/mo',  sites: '3 sites',    rate: '30 req/min' },
  pro:        { label: 'Pro',        color: 'var(--accent2)', price: '$79/mo',  sites: '10 sites',   rate: '60 req/min' },
  agency:     { label: 'Agency',     color: 'var(--blue)',    price: '$199/mo', sites: 'Unlimited',  rate: '300 req/min' },
  enterprise: { label: 'Enterprise', color: 'var(--blue)',    price: 'Custom',  sites: 'Unlimited',  rate: '300 req/min' },
}

// ── GEO LLM metadata ────────────────────────────────────────────────────────
export const GEO_LLM_META = {
  chatgpt: { name: 'ChatGPT', company: 'OpenAI', emoji: '\uD83D\uDFE2', color: '#10b981' },
  perplexity: { name: 'Perplexity', company: 'Perplexity', emoji: '\uD83D\uDD35', color: '#3b82f6' },
  claude: { name: 'Claude', company: 'Anthropic', emoji: '\uD83D\uDFE0', color: '#f59e0b' },
  gemini: { name: 'Gemini', company: 'Google', emoji: '\uD83D\uDFE3', color: '#8b5cf6' },
  grok: { name: 'Grok', company: 'xAI', emoji: '\uD83E\uDE75', color: '#06b6d4' },
  llama: { name: 'Llama', company: 'Meta', emoji: '\uD83D\uDD34', color: '#ef4444' },
}

// ── URL hash helpers ─────────────────────────────────────────────────────────
export const VALID_PAGES = ['overview', 'score', 'geo', 'analytics', 'content-doctor', 'citations', 'snippet', 'settings', 'ingest', 'registries', 'tenants']

export function getPageFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, '').trim()
  return VALID_PAGES.includes(hash) ? hash : 'overview'
}
