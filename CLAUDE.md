# Galuli — Claude Session Memory

> Last updated: 2026-03-03

---

## Project Overview

**Galuli** is a SaaS product that helps websites get found by AI engines (ChatGPT, Perplexity, Claude, etc.).
It provides a GEO (Generative Engine Optimization) score, Content Doctor fixes, AI traffic analytics, and an embeddable score badge.

**Live URL:** https://galuli.io
**Dashboard:** https://galuli.io/dashboard/
**Railway direct:** https://galui-production.up.railway.app
**Railway CNAME:** e2nfnk2r.up.railway.app

---

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI (Python), SQLite via `app/services/storage.py` |
| Frontend | React (Vite), single file `dashboard/src/App.jsx` |
| Hosting | Railway (Docker) |
| Billing | Lemon Squeezy (MoR — Israeli founder, Stripe not available) |
| DNS | Namecheap (or similar) — CNAME @ → e2nfnk2r.up.railway.app |
| Email | Resend (hello@galuli.io) |

---

## Architecture

### Frontend
- **Single-page app** at `/dashboard/` (Vite base: `/dashboard/`)
- **Hash-based routing** — tabs use `window.location.hash` (#overview, #geo, #settings, etc.)
- `navigate(page)` wrapper updates both hash and React state atomically
- Back/forward browser navigation works

### Backend
- FastAPI app serves React SPA from `/static/dashboard/` (built by Docker)
- Root `/` → serves `index.html` (redirect to dashboard)
- All non-API paths → SPA fallback (React Router handles)
- Multi-tenant: each user has an API key stored in `tenants` table

### Two SQLite Databases
The system uses **two separate SQLite files**:
| File | Path (env var) | Contents |
|---|---|---|
| Main DB | `data/registry.db` (`DATABASE_URL`) | registries, ingest_jobs, crawl_schedule, page_hashes, tenants, usage_log, tenant_domains, magic_tokens, analytics_events |
| Citations DB | `data/citations.db` (hardcoded in `CitationService`) | citation_queries, citation_results |

Both files are created automatically on first boot. If you mount a Railway volume, make sure **both paths** live on it (the default `data/` dir covers both).

### Key Files
```
galuli/
├── app/
│   ├── api/
│   │   ├── main.py           ← FastAPI app, SPA serving, health check
│   │   ├── routes/
│   │   │   ├── admin.py      ← DELETE /api/v1/admin/wipe-all (requires master key in prod)
│   │   │   ├── billing.py    ← LS webhook POST /api/v1/billing/ls-webhook
│   │   │   ├── push.py       ← POST /api/v1/push (galuli.js) + GET /api/v1/geo/{domain}
│   │   │   ├── score.py      ← GET /api/v1/score/{domain} + /badge + /suggestions
│   │   │   ├── citations.py  ← Citation Tracker (Pro only)
│   │   │   └── analytics.py
│   │   └── auth.py
│   ├── services/
│   │   ├── storage.py        ← SQLite wrapper
│   │   ├── tenant.py         ← tenant CRUD, plan management
│   │   ├── score.py          ← GEO score calculation
│   │   ├── scheduler.py      ← APScheduler auto-refresh
│   │   └── analytics.py
│   └── config.py             ← Pydantic settings (env vars)
├── dashboard/
│   └── src/
│       ├── App.jsx           ← ENTIRE frontend (one big file)
│       ├── api.js            ← fetch wrapper + all API calls
│       ├── index.css         ← design system / global styles
│       └── App.css
├── Dockerfile
├── .env.example
└── CLAUDE.md                 ← this file
```

---

## Billing — Lemon Squeezy

### Why LS (not Stripe)
Stripe doesn't support Israel for payouts. LS is a Merchant of Record, explicitly supports Israel, handles all VAT globally.

### Plans & Pricing
| Plan | Monthly | Annual | Sites | Rate |
|---|---|---|---|---|
| Free | $0 | — | 3 | 10 req/min |
| Starter | $9/mo | $90/yr | 10 | 30 req/min |
| Pro | $29/mo | $290/yr | Unlimited | 120 req/min |
| Enterprise | Custom | — | Unlimited | 300 req/min |

### Lemon Squeezy Variant IDs (Railway env vars)
| Var | Value | Description |
|---|---|---|
| `LS_VARIANT_STARTER` | 1353618 | Starter $9/mo |
| `LS_VARIANT_PRO` | 1353606 | Pro $29/mo |
| `LS_VARIANT_STARTER_ANNUAL` | 1353121 | Starter $90/yr |
| `LS_VARIANT_PRO_ANNUAL` | (not set yet) | Pro $290/yr — **TODO: create in LS and get ID** |

### Checkout URLs (in App.jsx → LS_URLS)
```js
const LS_URLS = {
  starter:        'https://galuli.io/checkout/buy/8bc3ebee-b31d-43ee-bbcc-5b47ba3b0022',
  starter_annual: null, // TODO: create Starter $90/yr variant in LS and paste URL here
  pro:            'https://galuli.io/checkout/buy/e280dc25-998e-4ca5-b224-5d6548d8f4e0',
  pro_annual:     null, // TODO: create Pro $290/yr variant in LS and paste URL here
}
```

### Webhook
- **Endpoint:** `POST /api/v1/billing/ls-webhook`
- **Secret:** `0cd9baba5cae595f706860fbd3a635eb` (set in LS dashboard + Railway as `LS_WEBHOOK_SECRET`)
- **Signature header:** `X-Signature` (HMAC-SHA256)
- **Events handled:**
  - `order_created`, `subscription_created`, `subscription_updated` → activate plan
  - `subscription_cancelled`, `subscription_expired` → downgrade to free
  - `subscription_payment_failed` → log warning
- **Auto-creates tenant** if email not found (customer paid before signing up)

### Railway Env Vars Needed
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
A Record     @    → 3.33.255.208     ← DELETED (was Lemon Squeezy, caused site hijack)
CNAME        @    → e2nfnk2r.up.railway.app
CNAME        www  → e2nfnk2r.up.railway.app
TXT          _railway-verify → railway-verify=3ccacaca6758c5c2df44dd92a7fef6f072...
```

**Important:** The LS A record (`3.33.255.208`) was accidentally added when setting up LS custom domain. It hijacked galuli.io. Was deleted 2026-02-28. Also removed galuli.io from LS Settings → Domains.

---

## Frontend — Key Components (App.jsx)

### Component Map
```
App
├── ToastContainer
├── Sidebar (tab navigation)
├── OverviewPage
├── ScorePage
├── GeoPage
├── AnalyticsPage
├── ContentDoctorPage
├── SnippetPage          ← user signs up / gets API key here
├── SettingsPage
│   ├── DangerZone       ← "Wipe all data" button (visible even without login)
│   └── UpgradeCTAs      ← monthly/annual toggle + plan cards
├── IngestPage
├── RegistriesPage
└── TenantsPage          ← admin only
```

### Routing
```js
const VALID_PAGES = ['overview','score','geo','analytics','content-doctor',
                     'snippet','settings','ingest','registries','tenants']
// Hash-based: galuli.io/dashboard/#settings
// navigate(page) updates both hash + React state
```

### UpgradeCTAs Component
Proper React component (extracted from broken IIFE) with monthly/annual toggle:
```jsx
function UpgradeCTAs({ plan, email }) {
  const [billing, setBilling] = useState('monthly')
  // Shows toggle + Starter card (free only) + Pro card
  // Starter: $9/mo or $90/yr, Pro: $29/mo or $290/yr
  // "2 months free" + "Save ~16%" badges on annual
}
```

### Admin Endpoints
- `DELETE /api/v1/admin/wipe-all` — clears all tables (registries, ingest_jobs, crawl_schedule, page_hashes)
- Callable from Settings → Danger Zone (no auth needed intentionally, dev tool)

---

## Tenant Service (tenant.py)

### Plan Limits
```python
PLAN_LIMITS = {
  "free":       {"domains": 3,   "rate_per_min": 10,  "js_enabled": False},
  "starter":    {"domains": 10,  "rate_per_min": 30,  "js_enabled": False},
  "pro":        {"domains": 9999,"rate_per_min": 120, "js_enabled": True},
  "enterprise": {"domains": 9999,"rate_per_min": 300, "js_enabled": True},
}
```

### Key Methods
- `activate_ls_subscription(email, plan, ls_subscription_id)` — upgrades tenant
- `deactivate_ls_subscription(email)` — downgrades to free
- Reuses `stripe_subscription_id` column to store LS subscription ID

---

## Config (config.py) — All Env Vars

```python
# Core
anthropic_api_key: str
firecrawl_api_key: str = ""
registry_api_key: str = ""
database_url: str = "data/registry.db"
base_api_url: str = "http://localhost:8000"
max_pages_per_crawl: int = 20
fast_model: str = "claude-haiku-4-5-20251001"
deep_model: str = "claude-sonnet-4-5-20250929"

# Lemon Squeezy
ls_webhook_secret: str = ""
ls_variant_starter: str = ""
ls_variant_starter_annual: str = ""
ls_variant_pro: str = ""
ls_variant_pro_annual: str = ""

# Email
resend_api_key: str = ""
email_from: str = "hello@galuli.io"
```

---

## Pending TODOs

1. **Pro annual variant** — create "$290/yr" variant in Lemon Squeezy, get checkout URL and variant ID
2. **Annual checkout URLs** — paste `starter_annual` and `pro_annual` URLs into `LS_URLS` in `App.jsx`
3. **Railway env var** — add `LS_VARIANT_PRO_ANNUAL=<id>` once created
4. **Commit & push** — all recent changes (annual plan support, UpgradeCTAs fix) not yet committed

---

## Design System (index.css)

**Inspired by Linear.app** — dark, dense, minimal. Sidebar layout, 14px base font.

### CSS Variables
```
--bg:       #0e0e10   (near-black)
--surface:  #141416   (sidebar, cards)
--surface2: #1a1a1e   (hover, inputs)
--surface3: #202024   (active sidebar item)
--border:   #2a2a30
--border2:  #333339
--text:     #e5e5e7
--subtle:   #a0a0a8
--muted:    #606068
--accent:   #5e6ad2   (Linear purple-indigo)
--accent2:  #7b84e0
--green:    #4aad52
--red:      #e5484d
--yellow:   #d9a53a
--sidebar-w: 220px
--radius:   8px
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
- **Left sidebar** (fixed, 220px) — replaces old top navbar
- **`.app-shell`** = flex row container
- **`.sidebar`** = fixed left panel with logo, nav items, footer
- **`.main-content`** = `margin-left: 220px`, padding 32px 40px
- Sidebar items use `.sidebar-item`, `.sidebar-item.active`, `.sidebar-item-icon`

---

## Deployment

**Docker** build: frontend built in first stage (`npm run build`), output copied to `/static/dashboard/`, served by FastAPI.

**Railway** auto-deploys on git push to main.

To deploy: `git add . && git commit -m "..." && git push`
