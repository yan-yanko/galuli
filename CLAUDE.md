# Galuli — Project Guide for Claude

> Last updated: 2026-04-03
> For change history see `CHANGELOG.md`. For pending work see `TODO.md`.

---

## Project Overview

**Galuli** is a SaaS product that helps websites get found by AI engines (ChatGPT, Perplexity, Claude, Gemini, Grok, Llama).
It provides a GEO score, Content Doctor fixes, AI traffic analytics, Citation Tracker, and an embeddable score badge.

**Live URL:** https://galuli.io | **Dashboard:** https://galuli.io/dashboard/

---

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI (Python 3.11), SQLite via `app/services/storage.py` |
| Frontend | React 19 (Vite), main file `dashboard/src/App.jsx` (~3,500+ lines — read with offset/limit) |
| Hosting | Railway (Docker, multi-stage build) |
| Billing | Lemon Squeezy (MoR — Stripe unavailable for Israel) |
| DNS | Namecheap — CNAME @ -> e2nfnk2r.up.railway.app |
| Email | Resend (hello@galuli.io) |
| LLM | Anthropic Claude (haiku for fast, sonnet for deep) |
| Citations | Perplexity Sonar + OpenAI gpt-4o-search-preview (optional) |

---

## Architecture

### Frontend
- **SPA** at `/dashboard/` with **hash-based routing** (#overview, #geo, #settings, etc.)
- `navigate(page)` updates hash + React state atomically; `hashchange` listener for back/forward
- **Lazy-mount + `display:none` tab pattern** — pages stay mounted after first visit, no state loss

### Backend
- FastAPI serves React SPA from `/static/dashboard/`; root `/` serves landing page
- All non-API paths -> SPA fallback (`/blog`, `/about`, `/roadmap`, etc.)
- Multi-tenant: each customer has a `cr_live_*` API key

### Two SQLite Databases
| File | Path | Contents |
|---|---|---|
| Main DB | `data/registry.db` (`DATABASE_URL`) | registries, ingest_jobs, crawl_schedule, page_hashes, tenants, usage_log, tenant_domains, magic_tokens, analytics_events |
| Citations DB | `data/citations.db` (hardcoded) | citation_queries, citation_results |

Both auto-created on boot. Both must live on the Railway `/data` volume.

### Key Files
```
app/api/main.py              <- FastAPI app, CORS, SPA serving
app/api/auth.py              <- APIKeyMiddleware (master + tenant keys)
app/api/routes/              <- All route handlers (admin, analytics, billing, citations, content_doctor, ingest, push, registry, score, tenants)
app/services/tenant.py       <- TenantService, PLAN_LIMITS (source of truth for pricing)
app/services/geo.py          <- calculate_geo_score()
app/services/score.py        <- calculate_score()
app/services/storage.py      <- SQLite wrapper
app/services/scheduler.py    <- APScheduler (3 jobs)
app/config.py                <- Pydantic settings (all env vars)
dashboard/src/App.jsx        <- Dashboard SPA (~3,500+ lines)
dashboard/src/Landing.jsx    <- Landing + ResultsPage (~1,060 lines)
dashboard/src/main.jsx       <- Root router (path-based, no react-router)
dashboard/src/Pricing.jsx    <- Pricing page
dashboard/src/Blog.jsx       <- 12 blog posts
dashboard/src/InstallGuide.jsx <- 12-platform install guide
dashboard/src/api.js         <- fetch wrapper + all API calls
dashboard/src/index.css      <- Design system (Linear-inspired)
static/galuli.js             <- Customer snippet (v3.2.0)
```

### Router Mount Order (FastAPI first-match)
```python
app.include_router(ingest.router,         prefix="/api/v1")
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
**Critical:** `score.py` is the sole handler for `/api/v1/score/*`.

---

## Frontend Routing

### Path-based (main.jsx)
| Path | Component |
|---|---|
| `/dashboard/*` | `<App />` (hash-based sub-routing) |
| `/blog`, `/blog/[slug]` | Blog pages |
| `/about`, `/roadmap`, `/pricing`, `/install` | Static pages |
| `/` | `<LandingPage>` or `<ResultsPage>` |
| `?token=...` | Magic link callback |

### Dashboard tabs (hash-based)
`overview` | `score` | `geo` | `analytics` | `content-doctor` | `citations` | `snippet` | `settings` | `ingest` | `registries` | `tenants`

### localStorage keys
| Key | Purpose |
|---|---|
| `galuli_api_key` | Auth for API calls |
| `galuli_api_url` | Override API base URL |
| `galuli_snippet_active` | Onboarding step 3 check |
| `galuli_onboarding_done` | Hides checklist |
| `galuli_theme` | 'dark' or 'light' |

---

## API Endpoints

### Public (no auth)
`GET /health` | `/galuli.js` | `/robots.txt` | `/sitemap.xml` | `/llms.txt`
`GET /registry/{domain}` (+ `/llms.txt`, `/ai-plugin.json`, `/status`)
`GET /api/v1/score/{domain}` (+ `/badge`, `/suggestions`) | `/api/v1/geo/{domain}`
`GET /api/v1/billing/plans` | `/api/v1/auth/magic-verify`

### Snippet (public POST, tenant auth via payload)
`POST /api/v1/push` | `/api/v1/analytics/event`

### Authenticated (X-API-Key header)
`POST /api/v1/tenants` | `/api/v1/auth/login` | `/api/v1/auth/magic-link`
`GET /api/v1/analytics/{domain}` (+ `/agents`, `/pages`)
`POST /api/v1/ingest` | `GET /api/v1/jobs/{job_id}`
`GET /api/v1/citations/{domain}` (Pro+) | `/api/v1/content-doctor/{domain}`
`DELETE /api/v1/admin/wipe-all` (master key only) | `/api/v1/admin/registry/{domain}`
`POST /api/v1/admin/refresh`

---

## Authentication (auth.py)

- **Open mode** (`REGISTRY_API_KEY` not set): no auth required
- **Auth mode** (`REGISTRY_API_KEY` set): `X-API-Key` header required for non-public routes
- `PUBLIC_PREFIXES` includes `/registry/`, `/dashboard`, `/api/v1/score/`, `/api/v1/geo/`, `/blog`, `/about`, `/roadmap`, `/pricing`, `/auth`, `/.well-known/`
- `PUBLIC_POST_EXACT` includes `/api/v1/push`, `/api/v1/analytics/event`, `/api/v1/tenants`, auth routes, billing webhooks
- CORS: `allow_origins=["*"]` (intentional — galuli.js runs on customer domains)
- `request.state.tenant` / `request.state.api_key` set by middleware

---

## galuli.js Snippet (v3.2.0)

Install: `<script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>`
Alt: `data-key="YOUR_KEY"` attribute on script tag.

On every page load: extracts page structure -> `POST /api/v1/push` (auth via `payload.tenant_key` in body, NOT header) + `POST /api/v1/analytics/event`.
SPA-compatible: monkey-patches `history.pushState` + `popstate` listener.

---

## Score Algorithm (score.py)

5 dimensions, 100 pts total: Content Coverage (25), Structure Quality (20), Machine Signals (20), Authority (20), Freshness (15).
Grades: A >= 85, B >= 70, C >= 55, D >= 40, F < 40.

**Badge flywheel:** SVG badge links to `galuli.io/?ref={domain}` with UTM params. Landing page auto-scans on `?ref=` param. This is the primary viral distribution mechanism.

---

## Billing — Lemon Squeezy

### Plans (source of truth: `PLAN_LIMITS` in `app/services/tenant.py`)
| Plan | Monthly | Annual | Sites | Rate/min | Req/day | JS |
|---|---|---|---|---|---|---|
| Free | $0 | -- | 3 | 10 | 50 | No |
| Starter | $29 | $249 | 3 | 30 | 500 | Yes |
| Pro | $79 | $679 | 10 | 60 | 2,000 | Yes |
| Agency | $199 | $1,990 | Unlimited | 300 | 50,000 | Yes |

### LS Variant IDs (Railway env vars)
`LS_VARIANT_STARTER=1353618` | `LS_VARIANT_PRO=1353606` | `LS_VARIANT_STARTER_ANNUAL=1353121` | `LS_VARIANT_PRO_ANNUAL` not set yet.

### Checkout URLs (App.jsx -> LS_URLS)
**WARNING:** LS checkout URLs still point to old $9/$29 variants. Need to create new LS variants and update URLs.

### Webhook
`POST /api/v1/billing/ls-webhook` — HMAC-SHA256 via `X-Signature` header.
Events: `order_created`/`subscription_created`/`subscription_updated` -> activate; `subscription_cancelled`/`subscription_expired` -> deactivate.
Auto-creates tenant if email not found.

---

## Scheduler Jobs (scheduler.py)

| Job | Trigger | Action |
|---|---|---|
| `refresh_stale_domains` | Every 6h | Re-crawls domains not updated in >7 days |
| `weekly_citation_checks` | Every 7 days | Citation checks for Pro+ tenants |
| `reset_daily_usage` | Midnight UTC | Resets `requests_today = 0` |

---

## Design System (index.css)

Linear-inspired dark theme. Key CSS variables:
```css
--bg: #0e0e10; --surface: #141416; --surface2: #1a1a1e; --surface3: #202024;
--border: #2a2a30; --border2: #333339; --text: #e5e5e7; --subtle: #a0a0a8; --muted: #606068;
--accent: #5e6ad2; --accent2: #7b84e0; --green: #4aad52; --red: #e5484d;
--sidebar-w: 220px; --radius: 8px;
```
Base font 14px. Sidebar 220px fixed left. `.main-content` padding `44px 60px`.

---

## Deployment

Docker multi-stage: Node builds dashboard -> Python stage runs uvicorn.
Railway auto-deploys on push to `main`. Volume at `/data` for SQLite persistence.

### CRITICAL: Do NOT add `USER appuser` to Dockerfile
Railway volumes mount as root at runtime. Non-root user can't write to `/data`. This caused an 11h outage.

---

## Config (config.py) — Key Env Vars

```
registry_api_key          # Master API key; empty = open mode
anthropic_api_key          # Required
firecrawl_api_key          # Optional, for JS-heavy sites
perplexity_api_key         # Required for citation checks
openai_api_key             # Optional, enables ChatGPT citations
database_url=data/registry.db
app_url=https://galuli.io
fast_model=claude-haiku-4-5-20251001
deep_model=claude-sonnet-4-5-20250929
ls_webhook_secret          # HMAC secret for LS webhooks
resend_api_key             # For magic link emails
```
