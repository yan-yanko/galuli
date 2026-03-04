# Galuli — Claude Session Memory

> Last updated: 2026-03-03

---

## Project Overview

**Galuli** is a SaaS product that helps websites get found by AI engines (ChatGPT, Perplexity, Claude, Gemini, Grok, Llama).
It provides a GEO (Generative Engine Optimization) score, Content Doctor fixes, AI traffic analytics, Citation Tracker, and an embeddable score badge.

**Live URL:** https://galuli.io
**Dashboard:** https://galuli.io/dashboard/
**Railway direct:** https://galui-production.up.railway.app
**Railway CNAME:** e2nfnk2r.up.railway.app

---

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI (Python 3.11), SQLite via `app/services/storage.py` |
| Frontend | React 19 (Vite), single file `dashboard/src/App.jsx` |
| Hosting | Railway (Docker, multi-stage build) |
| Billing | Lemon Squeezy (MoR — Israeli founder, Stripe not available) |
| DNS | Namecheap — CNAME @ → e2nfnk2r.up.railway.app |
| Email | Resend (hello@galuli.io) |
| LLM | Anthropic Claude (haiku for fast, sonnet for deep comprehension) |
| Citations | Perplexity Sonar + OpenAI gpt-4o-search-preview (optional) |

---

## Architecture

### Frontend
- **Single-page app** at `/dashboard/` (Vite base: `/dashboard/`)
- **Hash-based routing** — tabs use `window.location.hash` (#overview, #geo, #settings, etc.)
- `navigate(page)` wrapper updates both hash and React state atomically
- Back/forward browser navigation works via `popstate` listener

### Backend
- FastAPI app serves React SPA from `/static/dashboard/` (built by Docker first stage)
- Root `/` → serves `index.html` (landing page, React Router handles client-side routing)
- All non-API paths → SPA fallback so `/blog`, `/about`, `/roadmap` etc. work
- Multi-tenant: each customer has a `cr_live_*` API key stored in `tenants` table

### Two SQLite Databases
The system uses **two separate SQLite files**:
| File | Path (env var) | Contents |
|---|---|---|
| Main DB | `data/registry.db` (`DATABASE_URL`) | registries, ingest_jobs, crawl_schedule, page_hashes, tenants, usage_log, tenant_domains, magic_tokens, analytics_events |
| Citations DB | `data/citations.db` (hardcoded in `CitationService`) | citation_queries, citation_results |

Both files are created automatically on first boot via `CREATE TABLE IF NOT EXISTS`.
If you mount a Railway volume, make sure **both paths** live on it (the default `data/` dir covers both).

### Key Files
```
galuli/
├── app/
│   ├── api/
│   │   ├── main.py              ← FastAPI app, CORS, SPA serving, health check
│   │   ├── auth.py              ← APIKeyMiddleware (master key + tenant key modes)
│   │   └── routes/
│   │       ├── admin.py         ← DELETE /api/v1/admin/wipe-all (master key required in prod)
│   │       ├── analytics.py     ← GET /api/v1/analytics/{domain}/*
│   │       ├── billing.py       ← POST /api/v1/billing/ls-webhook
│   │       ├── citations.py     ← Citation Tracker (Pro+ only)
│   │       ├── content_doctor.py← Content Doctor analysis
│   │       ├── ingest.py        ← POST /api/v1/ingest (crawl-on-demand)
│   │       ├── push.py          ← POST /api/v1/push (galuli.js snippet) + GET /api/v1/geo/{domain}
│   │       ├── registry.py      ← GET /registry/{domain}/* (always public)
│   │       ├── score.py         ← GET /api/v1/score/{domain} + /badge + /suggestions
│   │       └── tenants.py       ← tenant CRUD, auth endpoints
│   ├── models/
│   │   ├── crawl.py             ← CrawlResult, PageContent
│   │   ├── jobs.py              ← IngestJob, JobStatus
│   │   └── registry.py          ← AIRegistry (the central data model)
│   ├── services/
│   │   ├── analytics.py         ← AI agent traffic tracking
│   │   ├── citation_tracker.py  ← CitationService (queries Perplexity + OpenAI for citations)
│   │   ├── comprehension.py     ← LLM extraction pipeline
│   │   ├── crawler.py           ← CrawlerService (httpx + Firecrawl)
│   │   ├── geo.py               ← calculate_geo_score() per-LLM scoring
│   │   ├── registry_builder.py  ← RegistryBuilder (assembles AIRegistry from raw LLM data)
│   │   ├── scheduler.py         ← APScheduler: 3 jobs (stale refresh, citation checks, usage reset)
│   │   ├── score.py             ← calculate_score() used by /push endpoint's push response
│   │   ├── storage.py           ← SQLite wrapper (main DB)
│   │   └── tenant.py            ← TenantService, Tenant model, PLAN_LIMITS
│   └── config.py                ← Pydantic settings (all env vars)
├── dashboard/
│   └── src/
│       ├── App.jsx              ← ENTIRE frontend (~2600 lines, one file)
│       ├── api.js               ← fetch wrapper + all API calls
│       ├── index.css            ← design system / global styles (Linear-inspired)
│       └── App.css
├── static/
│   └── galuli.js                ← Customer snippet (vanilla JS IIFE, v3.2.0)
├── Dockerfile
├── .env.example
└── CLAUDE.md                    ← this file
```

### Router Mount Order (important — FastAPI uses first match)
```python
# main.py registration order:
app.include_router(ingest.router,         prefix="/api/v1")           # /ingest, /jobs/*
app.include_router(push.router,           prefix="/api/v1")           # /push, /geo/{domain}
app.include_router(score.router,          prefix="/api/v1/score")     # /{domain}, /badge, /suggestions
app.include_router(registry.router,       prefix="/registry")
app.include_router(admin.router,          prefix="/api/v1/admin")
app.include_router(tenants.router,        prefix="/api/v1/tenants")
app.include_router(analytics.router,      prefix="/api/v1/analytics")
app.include_router(billing.router,        prefix="/api/v1")
app.include_router(content_doctor.router, prefix="/api/v1/content-doctor")
app.include_router(citations.router,      prefix="/api/v1/citations")
```
**Critical:** `push.py` does NOT register score routes anymore. `score.py` is the sole handler for `/api/v1/score/*`.

---

## API Endpoint Reference

### Public (no auth ever)
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check + indexed count |
| GET | `/galuli.js` | Snippet file (v3.2.0) |
| GET | `/galui.js` | 301 redirect → /galuli.js (legacy) |
| GET | `/robots.txt` | robots.txt (all AI crawlers: Allow /) |
| GET | `/sitemap.xml` | XML sitemap |
| GET | `/llms.txt` | AI-readable summary of Galuli |
| GET | `/registry/{domain}` | Full JSON capability registry |
| GET | `/registry/{domain}/llms.txt` | Domain's auto-generated llms.txt |
| GET | `/registry/{domain}/ai-plugin.json` | OpenAI plugin manifest |
| GET | `/registry/{domain}/status` | Live liveness check |
| GET | `/api/v1/billing/plans` | Plan list (public pricing page) |
| GET | `/api/v1/auth/magic-verify` | Magic link login redirect |

### Snippet endpoints (public POST — tenant auth via payload)
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/push` | galuli.js page data push (auth via `payload.tenant_key`) |
| POST | `/api/v1/analytics/event` | galuli.js analytics event (fire-and-forget, no auth) |

### Authenticated (X-API-Key header required in prod)
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/tenants` | Create tenant / sign up |
| POST | `/api/v1/auth/login` | Email + password login |
| POST | `/api/v1/auth/magic-link` | Send magic link email |
| GET | `/api/v1/score/{domain}` | AI Readiness Score (5 dimensions) |
| GET | `/api/v1/score/{domain}/badge` | Embeddable SVG badge (score ring, 220×80) |
| GET | `/api/v1/score/{domain}/suggestions` | Improvement suggestions |
| GET | `/api/v1/geo/{domain}` | Per-LLM GEO citation readiness score |
| GET | `/api/v1/analytics/{domain}` | AI traffic summary |
| GET | `/api/v1/analytics/{domain}/agents` | Agent breakdown |
| GET | `/api/v1/analytics/{domain}/pages` | Per-page breakdown |
| POST | `/api/v1/ingest` | Crawl-on-demand ingest |
| GET | `/api/v1/jobs/{job_id}` | Poll ingest job status |
| GET | `/api/v1/citations/{domain}` | Citation results (Pro+ only) |
| GET | `/api/v1/content-doctor/{domain}` | Content Doctor analysis |
| DELETE | `/api/v1/admin/wipe-all` | Wipe all data (master key required in prod) |
| DELETE | `/api/v1/admin/registry/{domain}` | Delete one registry |
| POST | `/api/v1/admin/refresh` | Force re-crawl a domain |

---

## Authentication System (auth.py)

### Two modes
1. **Open mode** (`REGISTRY_API_KEY` not set): No auth required. Tenant keys still attach to `request.state` for usage tracking if present.
2. **Auth mode** (`REGISTRY_API_KEY` set): Every non-public request must send `X-API-Key` header.

### Key sets in auth.py
```python
PUBLIC_EXACT = { "/health", "/", "/galuli.js", "/robots.txt", "/llms.txt", ... }
PUBLIC_PREFIXES = ("/registry/", "/dashboard", "/blog", "/about", ...)
PUBLIC_POST_EXACT = {
    "/api/v1/tenants",          # signup
    "/api/v1/auth/signup",
    "/api/v1/auth/login",
    "/api/v1/auth/magic-link",
    "/api/v1/billing/ls-webhook",   # LS sends no auth header
    "/api/v1/billing/webhook",      # Stripe (legacy)
    "/api/v1/push",                 # snippet — auth via payload.tenant_key
    "/api/v1/analytics/event",      # snippet analytics — fire-and-forget
}
```

### request.state
After middleware, handlers receive:
- `request.state.tenant` — `Tenant` object or `None` (if master key used)
- `request.state.api_key` — the raw key string

### CORS
`allow_origins=["*"]` (intentional) — galuli.js runs on any customer domain and needs to POST. `allow_credentials=False` (required when using `*`).

---

## galuli.js Snippet (static/galuli.js)

**Version:** 3.2.0
**Install (query string):** `<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>`
**Install (data-key attr):** `<script src="https://galuli.io/galuli.js" data-key="YOUR_KEY" async></script>`
Both formats work. Query string is shown in the dashboard. `data-key` is the friendly fallback.

### What it does on every page load:
1. Reads tenant API key from `data-key` attribute OR `?key=` query string on `src`
2. Extracts page structure: title, description, headings, CTAs, forms, schema.org JSON-LD
3. Registers WebMCP tools if `window.__webmcp__` present
4. Sends `POST /api/v1/push` with structured payload
5. Sends `POST /api/v1/analytics/event` with User-Agent (AI agent detection)

### Key globals
```js
window.galuli = { version, domain, getTools(), ... }
window.galui = window.galuli  // backward-compat alias
```

### SPA navigation
v3.2.0 monkey-patches `history.pushState` and listens to `popstate` to re-run
page analysis on every route change. This makes galuli.js fully compatible with
Lovable, Base44, Replit, Next.js, React Router, and any client-side SPA.

### Critical: tenant auth
The snippet authenticates via `payload.tenant_key` inside the POST body (NOT via header), because it runs on customer sites where setting custom headers is CORS-restricted for non-preflight requests.

---

## Score Algorithm (score.py routes)

Active endpoint: `GET /api/v1/score/{domain}` (handled by `app/api/routes/score.py`)

### 5 Dimensions (total 100 pts)
| Dimension | Max | What it measures |
|---|---|---|
| Content Coverage | 25 | Number of capabilities documented |
| Structure Quality | 20 | Pricing tiers, API base URL, auth methods, SDKs |
| Machine Signals | 20 | llms.txt, ai-plugin, WebMCP, confidence score, robots.txt, schema.org |
| Authority | 20 | Docs URL, support URL, pricing page, status page, description length |
| Freshness | 15 | Pages crawled count + source (push=realtime bonus vs crawl) |

### Grade thresholds
| Grade | Score | Label |
|---|---|---|
| A | ≥ 85 | Excellent AI Visibility |
| B | ≥ 70 | Good AI Visibility |
| C | ≥ 55 | Fair AI Visibility |
| D | ≥ 40 | Needs Improvement |
| F | < 40 | Poor AI Visibility |

### Badge
SVG score ring (220×80), served with `Cache-Control: max-age=3600` and `Access-Control-Allow-Origin: *`.

---

## GEO Score (services/geo.py)

Active endpoint: `GET /api/v1/geo/{domain}` (handled by `push.py` router)

Returns per-LLM citation readiness scores for: **ChatGPT, Perplexity, Claude, Gemini, Grok, Llama**.
Each engine has different weights based on what it values (freshness vs. authority vs. structured data vs. WebMCP).

---

## Citation Tracker (citations.py)

**Pro+ only** — enforced by `_require_pro()` in citations.py.

Uses a second SQLite DB (`data/citations.db`) with tables:
- `citation_queries` — saved queries per domain
- `citation_results` — result snapshots (found/not found, snippet, source URL)

Runs queries against:
- **Perplexity Sonar** (`PERPLEXITY_API_KEY` required)
- **OpenAI gpt-4o-search-preview** (`OPENAI_API_KEY` optional)
- **Claude** (via Anthropic, always available)

Weekly auto-check via APScheduler for all Pro+ tenants that have saved queries.

---

## Scheduler Jobs (scheduler.py)

Three APScheduler jobs, all started on app boot:

| Job ID | Trigger | What it does |
|---|---|---|
| `refresh_stale_domains` | Every 6h | Re-crawls domains not updated in >7 days (`auto_refresh_interval_hours`) |
| `weekly_citation_checks` | Every 7 days | Runs citation checks for all Pro+ tenants with saved queries |
| `reset_daily_usage` | CronTrigger midnight UTC | Resets `requests_today = 0` for all tenants |

---

## Billing — Lemon Squeezy

### Why LS (not Stripe)
Stripe doesn't support Israel for payouts. LS is a Merchant of Record, handles all VAT globally.

### Plans & Actual Limits
| Plan | Monthly | Annual | Sites | Rate/min | Req/day | JS |
|---|---|---|---|---|---|---|
| Free | $0 | — | 3 | 10 | 50 | ✗ |
| Starter | $9 | $79 | 1 | 30 | 500 | ✓ |
| Pro | $29 | $249 | 10 | 60 | 2,000 | ✓ |
| Agency | $799/yr | — | ∞ | 300 | 50,000 | ✓ |
| Enterprise | Custom | — | ∞ | 300 | 50,000 | ✓ |

Source of truth: `PLAN_LIMITS` dict in `app/services/tenant.py`.

### Lemon Squeezy Variant IDs (Railway env vars)
| Var | Value | Description |
|---|---|---|
| `LS_VARIANT_STARTER` | 1353618 | Starter $9/mo |
| `LS_VARIANT_PRO` | 1353606 | Pro $29/mo |
| `LS_VARIANT_STARTER_ANNUAL` | 1353121 | Starter $79/yr |
| `LS_VARIANT_PRO_ANNUAL` | *(not set yet)* | Pro $249/yr — **TODO: create in LS** |

### Checkout URLs (in App.jsx → LS_URLS)
```js
const LS_URLS = {
  starter:        'https://galuli.io/checkout/buy/8bc3ebee-b31d-43ee-bbcc-5b47ba3b0022',
  starter_annual: null,  // TODO: create Starter $79/yr variant in LS and paste URL here
  pro:            'https://galuli.io/checkout/buy/e280dc25-998e-4ca5-b224-5d6548d8f4e0',
  pro_annual:     null,  // TODO: create Pro $249/yr variant in LS and paste URL here
}
```

### Webhook
- **Endpoint:** `POST /api/v1/billing/ls-webhook`
- **Secret:** `0cd9baba5cae595f706860fbd3a635eb` (set in LS dashboard + Railway as `LS_WEBHOOK_SECRET`)
- **Signature header:** `X-Signature` (HMAC-SHA256)
- **Events handled:**
  - `order_created`, `subscription_created`, `subscription_updated` → `activate_ls_subscription()`
  - `subscription_cancelled`, `subscription_expired` → `deactivate_ls_subscription()`
  - `subscription_payment_failed` → log warning only
- **Auto-creates tenant** if email not found (customer paid before signing up)

### Required Railway Env Vars
```
LS_WEBHOOK_SECRET=0cd9baba5cae595f706860fbd3a635eb
LS_VARIANT_STARTER=1353618
LS_VARIANT_PRO=1353606
LS_VARIANT_STARTER_ANNUAL=1353121
LS_VARIANT_PRO_ANNUAL=<TODO — create in LS first>
```

---

## DNS Setup (Namecheap)

Current records (correct state):
```
CNAME        @    → e2nfnk2r.up.railway.app
CNAME        www  → e2nfnk2r.up.railway.app
TXT          _railway-verify → railway-verify=3ccacaca6758c5c2df44dd92a7fef6f072...
```

**History:** A LS A record (`3.33.255.208`) was accidentally added when setting up LS custom domain — it hijacked galuli.io. Was deleted 2026-02-28. Also removed galuli.io from LS Settings → Domains.

---

## Frontend — Key Components (App.jsx)

### Component Map
```
App
├── ToastContainer
├── Sidebar (tab navigation + plan badge)
├── OverviewPage        ← score summary, quick actions
├── ScorePage           ← full 5-dimension score breakdown
├── GeoPage             ← per-LLM citation readiness
├── AnalyticsPage       ← AI agent traffic (events + agents + pages tabs)
├── ContentDoctorPage   ← Authority Gap Scanner + Structural Optimizer
├── SnippetPage         ← user signs up / gets API key / installs snippet
├── SettingsPage
│   ├── DangerZone      ← "Wipe all data" button (sends X-API-Key)
│   └── UpgradeCTAs     ← monthly/annual toggle + Starter + Pro cards
├── IngestPage          ← crawl-on-demand + job status polling
├── RegistriesPage      ← browse all indexed domains
└── TenantsPage         ← admin-only tenant management
```

### Routing
```js
const VALID_PAGES = ['overview','score','geo','analytics','content-doctor',
                     'snippet','settings','ingest','registries','tenants']
// Hash-based: galuli.io/dashboard/#settings
// navigate(page) updates both hash + React state atomically
// popstate listener handles browser back/forward
```

### Plan display constants (PLAN_DETAILS in App.jsx)
```js
const PLAN_DETAILS = {
  free:       { label: 'Free',       price: '$0/mo',    sites: '3 sites',   rate: '10 req/min' },
  starter:    { label: 'Starter',    price: '$9/mo',    sites: '1 site',    rate: '30 req/min' },
  pro:        { label: 'Pro',        price: '$29/mo',   sites: '10 sites',  rate: '60 req/min' },
  agency:     { label: 'Agency',     price: '$799/yr',  sites: 'Unlimited', rate: '300 req/min' },
  enterprise: { label: 'Enterprise', price: 'Custom',   sites: 'Unlimited', rate: '300 req/min' },
}
```

### UpgradeCTAs Component
```jsx
function UpgradeCTAs({ plan, email }) {
  const [billing, setBilling] = useState('monthly')
  // Monthly/annual toggle — annual shows "Save ~27%" (Starter) / "Save ~28%" (Pro)
  // Starter: $9/mo or $79/yr | Pro: $29/mo or $249/yr
  // Visible to free and starter plans only
}
```

---

## Tenant Service (tenant.py)

### PLAN_LIMITS (source of truth)
```python
PLAN_LIMITS = {
  "free":       {"domains": 3,   "rate_per_min": 10,  "requests_today": 50,    "js_enabled": 0},
  "starter":    {"domains": 1,   "rate_per_min": 30,  "requests_today": 500,   "js_enabled": 1},
  "pro":        {"domains": 10,  "rate_per_min": 60,  "requests_today": 2000,  "js_enabled": 1},
  "agency":     {"domains": 999, "rate_per_min": 300, "requests_today": 50000, "js_enabled": 1},
  "enterprise": {"domains": 999, "rate_per_min": 300, "requests_today": 50000, "js_enabled": 1},
}
```

### Key Methods
- `create_tenant(name, email, plan, password)` — creates `cr_live_*` key
- `authenticate(email, password)` — password login
- `create_magic_token(email)` / `verify_magic_token(token)` — passwordless login
- `activate_ls_subscription(email, plan, ls_subscription_id)` — upgrades on LS webhook
- `deactivate_ls_subscription(email)` — downgrades to free on cancellation
- `is_domain_allowed(api_key, domain)` — auto-registers domain if under limit
- `record_request(api_key, endpoint, domain)` — increments requests_today + requests_total
- `reset_daily_usage()` — sets requests_today=0 for all tenants (called midnight UTC)

**Note:** `stripe_subscription_id` column is reused to store LS subscription IDs (no migration needed).

---

## Config (config.py) — All Env Vars

```python
# Auth
registry_api_key: str = ""            # X-API-Key master key; empty = open/dev mode

# Anthropic (required)
anthropic_api_key: str = ""

# External services (optional)
firecrawl_api_key: str = ""           # Recommended for JS-heavy sites
perplexity_api_key: str = ""          # Required for Perplexity citation checks
openai_api_key: str = ""              # Optional — enables ChatGPT citation checks

# Storage
database_url: str = "data/registry.db"

# Service identity
base_api_url: str = "http://localhost:8000"
app_url: str = "https://galuli.io"    # used in email links

# Crawl settings
max_pages_per_crawl: int = 8
crawl_timeout_seconds: int = 10
playwright_enabled: bool = False      # requires Playwright install

# LLM models
fast_model: str = "claude-haiku-4-5-20251001"
deep_model: str = "claude-sonnet-4-5-20250929"

# Lemon Squeezy
ls_webhook_secret: str = ""
ls_variant_starter: str = "1353618"
ls_variant_starter_annual: str = "1353121"
ls_variant_pro: str = "1353606"
ls_variant_pro_annual: str = ""       # TODO: create in LS

# Email (Resend)
resend_api_key: str = ""
email_from: str = "hello@galuli.io"

# Citation Tracker
citation_max_queries: int = 5         # Max tracked queries per domain

# Scheduler
auto_refresh_interval_hours: int = 168  # 7 days
```

---

## Design System (index.css)

**Inspired by Linear.app** — dark, dense, minimal. Sidebar layout, 14px base font.

### CSS Variables
```css
--bg:        #0e0e10   /* near-black background */
--surface:   #141416   /* sidebar, cards */
--surface2:  #1a1a1e   /* hover states, inputs */
--surface3:  #202024   /* active sidebar item */
--border:    #2a2a30
--border2:   #333339
--text:      #e5e5e7
--subtle:    #a0a0a8
--muted:     #606068
--accent:    #5e6ad2   /* Linear purple-indigo */
--accent2:   #7b84e0
--green:     #4aad52
--red:       #e5484d
--yellow:    #d9a53a
--purple:    #8b5cf6
--sidebar-w: 220px
--radius:    8px
--radius-sm: 6px
```

### Key sizes
- Base font: **14px** (Linear-style density)
- Page header h1: **18px**, weight 600
- Table td: **13px**
- Buttons: **13px**, padding 7px 14px
- Stat value: **32px**
- Sidebar item: **14px**

### Layout
- **Left sidebar** (fixed, 220px) — `.sidebar` with logo, nav items, footer
- **`.app-shell`** = flex row container
- **`.main-content`** = `margin-left: 220px`, padding 32px 40px
- Sidebar items: `.sidebar-item`, `.sidebar-item.active`, `.sidebar-item-icon`

---

## Deployment

**Docker** multi-stage build:
1. Node stage: `npm run build` in `dashboard/` → output in `/static/dashboard/`
2. Python stage: copies static files, installs pip deps, runs `uvicorn app.api.main:app`

**Railway** auto-deploys on git push to `main`.

```
git add . && git commit -m "..." && git push
```

**Volume:** Mount at `/data` on Railway so SQLite persists across deploys.
Both `data/registry.db` and `data/citations.db` live in the same `/data` volume dir.

---

## Bug Fix Log (2026-03-02 — 2026-03-03)

All critical issues fixed before launch. Committed in two batches:
- `efb0a7b` — 8 critical/high bugs fixed
- `a7b73be` — 6 UX/polish fixes

### Critical fixes (efb0a7b)
| # | File | Bug | Fix |
|---|---|---|---|
| 1 | `static/galuli.js` | `window.galui = window.galuli` inside object literal → syntax error, broke every customer install | Moved alias after closing `};` |
| 2 | `static/galuli.js` | Push URL was `/api/v1/ingest/push` (404) | Fixed to `/api/v1/push` |
| 3 | `app/api/auth.py` | `/api/v1/push` and `/api/v1/analytics/event` not in `PUBLIC_POST_EXACT` → snippet got 401 in prod | Added both paths to public list |
| 4 | `app/api/main.py` | CORS restricted to `localhost` + `lovable.app` → snippet blocked on customer sites | Changed to `allow_origins=["*"]` |
| 5 | `dashboard/src/api.js` | `DEFAULT_KEY = "kotleryan1984"` hardcoded — unauthenticated users silently used a real key | Removed hardcoded key entirely |
| 6 | `dashboard/src/App.jsx` | `PLAN_DETAILS` showed wrong site limits/rates; `UpgradeCTAs` showed wrong annual prices | Fixed all values to match `PLAN_LIMITS` |
| 7 | `app/api/routes/citations.py` | Pro gate was commented out → free users had full Citation Tracker access | Restored `_require_pro()` guard |
| 8 | `dashboard/src/App.jsx` | TenantsPage plan dropdown missing `starter`/`agency`, Pro showed wrong limits | Added all plans with correct limits |

### Polish fixes (a7b73be)
| # | File | Issue | Fix |
|---|---|---|---|
| 5 | `push.py` / `score.py` | push.py had dead score/badge/suggestions routes shadowing score.py | Removed dead routes from push.py; score.py is now authoritative |
| 6 | `admin.py` | `DELETE /wipe-all` had no auth check — anyone could wipe the DB | Now requires master key when `REGISTRY_API_KEY` is set |
| 7 | `scheduler.py` + `tenant.py` | `requests_today` counter never reset — daily limits meaningless | Added `reset_daily_usage()` + midnight UTC cron job |
| 8 | `vite.config.js` | 505KB monolithic bundle, warned on every build | Split `react`+`react-dom` into `vendor-react` chunk; raised limit to 600KB |
| 9 | `push.py` | Docstring said `POST /api/v1/ingest/push` (wrong path, wrong snippet name) | Fixed to `POST /api/v1/push` + `galuli.js` |
| 10 | `CLAUDE.md` | Two-DB architecture undocumented | Documented both DBs with paths and contents |

---

## Pending TODOs

1. **Pro annual variant** — create "$249/yr" variant in Lemon Squeezy, get checkout URL and variant ID
2. **Starter annual URL** — create "$79/yr" variant in LS, paste URL into `LS_URLS.starter_annual` in `App.jsx`
3. **Railway env var** — add `LS_VARIANT_PRO_ANNUAL=<id>` once created in LS
4. **Manual QA** — test galuli.js snippet install end-to-end, LS checkout flow, magic link email
