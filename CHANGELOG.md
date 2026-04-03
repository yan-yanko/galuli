# Galuli — Change Log & Bug Fixes

## Change Log

### 2026-04-01 — GTM launch: badge flywheel + pricing update + SMB messaging (commit `29efb8d`)

#### Badge flywheel (viral distribution engine)
| File | Change |
|---|---|
| `app/api/routes/score.py` | Badge SVG now wraps all content in `<a>` linking to `galuli.io/?ref={domain}&utm_source=badge&utm_medium=embed&utm_campaign=score_badge`. Added "Check yours ->" micro-CTA in badge corner. |
| `dashboard/src/Landing.jsx` | Badge embed code in ResultsPage includes clickable link with UTM params. Landing page reads `?ref=` query param, pre-fills scan input, auto-triggers scan on load. |

#### Pricing update ($29/$79/$199)
| File | Change |
|---|---|
| `app/services/tenant.py` | `PLAN_LIMITS`: Starter domains 1 -> 3 |
| `dashboard/src/App.jsx` | `PLAN_DETAILS`: Starter $9->$29, Pro $29->$79, Agency $799/yr->$199/mo. Updated UpgradeCTAs display ($29/$249yr, $79/$679yr). Updated Content Doctor paywall CTA, Citations paywall CTA, Settings billing description. |
| `dashboard/src/Pricing.jsx` | Full pricing page rebuilt: Starter $29 (3 sites), Pro $79 (10 sites, +competitor tracking, +Content Doctor), Agency $199/mo (was $799/yr). Updated comparison table with Content Doctor and competitor tracking rows. |
| `dashboard/src/Landing.jsx` | Updated FAQ "$29/mo", ResultsPage "from $29/mo", agency section "$199/mo". |

**Note:** Code-side pricing is updated. Lemon Squeezy variants still have old prices -- need to create new LS variants and update checkout URLs.

#### SMB messaging overhaul
| File | Section | Before | After |
|---|---|---|---|
| `Landing.jsx` | Hero H1 | "AI can't cite you if it can't find you." | "Be seen by AI, not just Google." |
| `Landing.jsx` | Hero sub | ChatGPT/Perplexity/Claude recommend products... | Your customers are asking ChatGPT... not Google. |
| `Landing.jsx` | Bullets | Free instant scan / Clear action items / One script tag | Know your AI score in 60 seconds / Get cited, not just indexed / One script tag. No developer needed. |
| `Landing.jsx` | Contrast H2 | "Most tools track AI visibility. Galuli fixes it." | "Other tools tell you the problem. Galuli fixes it." |
| `Landing.jsx` | Invisible section | "Most websites are invisible to AI." | "Your customers ask AI now. Not Google." |
| `Landing.jsx` | Features H2 | "Everything AI needs to read your site." | "Everything you need to get cited by AI." |
| `Landing.jsx` | Score scale H2 | "How readable is your website to AI?" | "Your AI Readiness Score" |
| `Landing.jsx` | FAQ | Generic AI visibility framing | Leads with 63% of buyers, 5x conversion, "Do I need a developer?" |
| `Landing.jsx` | Bottom CTA | "Ready to join?" | "Your AI score in 60 seconds." |

---

### 2026-03-07 — Competitive positioning update (commits `d38a70a`, `0f3d901`, `9dc0078`)

#### Competitive analysis session
Reviewed 5 competitors to understand market positioning:

| Competitor | Type | Pricing | Key differentiator vs Galuli |
|---|---|---|---|
| **Sight AI** (trysight.ai) | Content gen + visibility tracking | $49-$999/mo | Content generation = retention moat. Galuli doesn't generate content. |
| **Geoptie** (geoptie.com) | AI rank tracker (prompt monitoring) | $490-$1,990/yr | Tracks where you rank but doesn't fix anything. Galuli fixes. |
| **Seeders** (seeders.com) | Traditional cross-border SEO agency | N/A | Not a competitor. |
| **Writesonic** | Full platform: track -> action -> content | Undisclosed (Series A+) | 120M proprietary AI conversations = data moat. Targets enterprise. |
| **Surfer SEO** | SEO optimizer + AI tracker (beta) | Undisclosed (150k users) | Biggest long-term threat -- existing user base adding GEO features. |

**Key strategic findings:**
1. Everyone measures. Nobody fixes. Galuli auto-generates llms.txt, registers WebMCP, audits robots.txt -- nobody else does this automatically.
2. Galuli is dramatically underpriced. Geoptie charges $990/yr for a rank tracker with no auto-fix. Market validates $490-$1,990/yr pricing.
3. Content generation is a trap. Galuli's "fix existing sites" angle is cleaner and nobody else owns it.
4. Surfer SEO is the biggest threat. 150k users, already adding AI tracker beta. Window to establish position is 12-18 months.
5. Prompt tracking is the missing retention hook.
6. Pricing recommendation: Starter $9/mo -> $19-29/mo, Pro $29/mo -> $59-79/mo. Agency $799/yr is competitive.

#### Landing page changes (d38a70a) -- Agency feedback fixes
| File | Change |
|---|---|
| `dashboard/src/Landing.jsx` | H1: "Make your website readable by AI" -> "Get cited by AI, not just Google." |
| `dashboard/src/Landing.jsx` | Subheadline: feature-focused -> leads with 5x conversion rate stat |
| `dashboard/src/Landing.jsx` | Hero bullets: Effortless/Affordable/Universal -> 5x conversion / One script / All 6 engines |
| `dashboard/src/Landing.jsx` | ResultsPage: added plain-English score interpretation below grade badges |
| `dashboard/src/Landing.jsx` | ResultsPage: added "what gets better" nudge block above locked features |
| `dashboard/src/Landing.jsx` | New "For agencies" section between FAQ and bottom CTA |

#### Competitive positioning update (9dc0078)
| File | Change |
|---|---|
| `dashboard/src/Landing.jsx` | Subheadline: "Other tools track where you rank in AI answers. Galuli fixes why you don't." |
| `dashboard/src/Landing.jsx` | Stats strip: "$750B AI-mediated commerce" -> "63% of purchases start with AI" |
| `dashboard/src/Landing.jsx` | New contrast section: "Most tools measure AI visibility. Galuli creates it." |
| `dashboard/src/Landing.jsx` | "How it works" H2: "From invisible to cited in three steps" |

---

### 2026-03-06 — Dashboard UX overhaul + bug fixes (commits `9bec295`, `62992b4`, `f9b1215`, `1ba3048`)

#### Dashboard UX (9bec295)
- Added `InfoTip` component, `OnboardingChecklist`, `NAV_SECTIONS` (SETUP/INSIGHTS/TOOLS groups)
- SnippetPage: status banner + localStorage persistence + platform guides link

#### Bug fixes + design (62992b4)
- Inline two-step delete confirmation (replaced `confirm()` dialog)
- "Remove all sites" now uses `getMyDomains()` + per-domain delete (was `wipeAll()` which required master key)
- Increased padding/sizing across `.main-content`, `.card`, `.stat-card`, `.page-header h1`

#### Auth + score/spinner fixes (f9b1215)
- Added `/api/v1/score/` and `/api/v1/geo/` to `PUBLIC_PREFIXES`
- Score catch sets `'failed'` state instead of swallowing errors

#### Delete gate fix (1ba3048)
- `handleDelete` checks for API key first; no key -> toast + redirect to snippet tab

### 2026-03-06 — Mascot + landing page (commits `892c9d8`, `f0cdb1d`, `ca2f700`)
- Added GaluMascot with emoji fallback, mascot PNG, SimilarWeb callout banner

### 2026-03-05 — Full QA pass + tab state persistence (commit `531fe4e`)
- Lazy-mount + `display:none` tab pattern
- Fixed: CitationTrackerPage isPro hardcoded, ContentDoctorPage missing agency, plan badges, retry cards

### 2026-03-05 — Dockerfile non-root user outage fix (commit `8884c6b`)
- Removed `USER appuser` -- Railway volumes require root. Caused 11h outage.

### 2026-03-04 — Content & install guide (commits `c984a58`)
- galuli.js v3.2.0 (SPA nav, data-key attribute)
- InstallGuide.jsx (12 platforms), 3 new blog posts

### 2026-03-02 — 2026-03-03 — Security hardening + launch fixes
- `efb0a7b` — 8 critical/high bugs fixed
- `a7b73be` — 6 UX/polish fixes

---

## Bug Fix Log

### 2026-03-06 fixes
| # | File | Bug | Fix |
|---|---|---|---|
| 1 | `auth.py` | `/api/v1/score/*` not public -> 401 -> spinner stuck | Added to `PUBLIC_PREFIXES` |
| 2 | `App.jsx` | Score catch was `() => {}` -> no failed state | Set `scores[domain] = 'failed'` |
| 3 | `App.jsx` | Avg score showed red when null (ternary fallthrough) | Added null check |
| 4 | `App.jsx` | `confirm()` dialog for delete | Inline two-step confirmation |
| 5 | `App.jsx` | `wipeAll()` requires master key -> 403 | Loop `getMyDomains()` + `deleteRegistry()` |
| 6 | `App.jsx` | Delete with no key -> confusing error | Key check + toast + redirect |

### 2026-03-05 QA fixes
| # | File | Bug | Fix |
|---|---|---|---|
| 1 | `App.jsx` | Tab switch unmounts -> data lost | Lazy-mount + `display:none` |
| 2 | `App.jsx` | `isPro = true` hardcoded | Restored plan check |
| 3 | `App.jsx` | Agency missing from `isPaid` | Added `'agency'` |
| 4 | `App.jsx` | starter/agency badge unmapped | Added badge colors |
| 5 | `App.jsx` | Silent `.catch` on score/geo | Retry card for null states |
| 6 | `Dockerfile` | Non-root user -> SQLite unwritable | Removed non-root user |

### 2026-03-02 critical fixes (efb0a7b)
| # | File | Bug | Fix |
|---|---|---|---|
| 1 | `galuli.js` | `window.galui` alias inside object literal -> syntax error | Moved after closing |
| 2 | `galuli.js` | Push URL was `/api/v1/ingest/push` (404) | Fixed to `/api/v1/push` |
| 3 | `auth.py` | `/api/v1/push` not in public list -> 401 | Added to `PUBLIC_POST_EXACT` |
| 4 | `main.py` | CORS restricted -> snippet blocked | `allow_origins=["*"]` |
| 5 | `api.js` | Hardcoded `DEFAULT_KEY` | Removed |
| 6 | `App.jsx` | `PLAN_DETAILS` wrong values | Fixed to match `PLAN_LIMITS` |
| 7 | `citations.py` | Pro gate commented out | Restored `_require_pro()` |
| 8 | `App.jsx` | TenantsPage missing plans | Added all plans |

### 2026-03-03 polish fixes (a7b73be)
| # | File | Issue | Fix |
|---|---|---|---|
| 1 | `push.py`/`score.py` | Dead score routes in push.py | Removed; score.py is authoritative |
| 2 | `admin.py` | No auth on wipe-all | Requires master key in prod |
| 3 | `scheduler.py` | `requests_today` never reset | Added `reset_daily_usage()` + cron |
| 4 | `vite.config.js` | 505KB bundle | Split vendor chunk; raised limit |
| 5 | `push.py` | Wrong docstring paths | Fixed |
| 6 | `CLAUDE.md` | Two-DB undocumented | Documented |
