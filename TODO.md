# Galuli — Pending TODOs & Technical Debt

## Pending TODOs

### Agency feedback (in progress)
1. **Case study block** -- Yan doing manually: one real before/after (domain, score change, measurable outcome). Will be added as a new section in `Landing.jsx`.

### Pricing (partially done -- 2026-04-01)
- ~~Raise prices~~ -- **DONE in code.** Starter $29/mo, Pro $79/mo, Agency $199/mo.
- **Still TODO:** update actual Lemon Squeezy variant prices in the LS dashboard and create new checkout URLs.

### Product roadmap (from competitive analysis)
- **Self-serve prompt tracking** -- add to Citation Tracker: user enters a query, Galuli runs it weekly across all 6 AI engines, shows trend over time. This is the retention hook every competitor uses.

### Billing
- **Update LS variants** -- LS still has old prices ($9/$29). Create new variants at $29/$79/$199, get new checkout URLs, update `LS_URLS` in `App.jsx`.
- **Pro annual variant** -- create "$679/yr" variant in LS, paste into `LS_URLS.pro_annual` + set `LS_VARIANT_PRO_ANNUAL` Railway env var.
- **Starter annual URL** -- create "$249/yr" variant in LS, paste into `LS_URLS.starter_annual`.

### QA / ops
- **Manual QA** -- test galuli.js end-to-end on HTML, WordPress, Next.js SPA; LS checkout flow; magic link email.
- **Deploy checklist** -- pre-push checklist: plan gates, no hardcoded keys, LS URLs correct, build passes.

### Dashboard
- **Install guide nav links** -- add /install link to About.jsx, Roadmap.jsx, Blog.jsx navbars.
- **Delete domain UX** -- `GET /registry/` returns ALL domains. Filter OverviewPage to `api.getMyDomains()`.

---

## Known Technical Debt

### SQLite on Railway (highest priority)
- Single point of failure, no replication, no managed backups, single-region volume.
- Already caused one 11h outage.
- **Fix:** Migrate to Railway Postgres or Neon.

### App.jsx is ~3,500+ lines
- Bug hunts require reading in 100-line chunks.
- **Fix:** Split into one file per page component + shared `components/` folder.

### OverviewPage shows global registry, not per-tenant
- `GET /registry/` returns ALL domains, not just the current user's.
- **Fix:** Use `api.getMyDomains()` + load scores only for those domains.

### Citation Tracker data quality
- ChatGPT and Claude don't reliably expose citation sources in API responses.
- **Fix:** Update UI copy to set accurate expectations per engine.

### No pre-deploy test suite
- Plan gates, API auth, snippet availability discovered through manual testing or production breakage.
- **Fix:** Minimum viable pytest hitting `/health`, `/api/v1/push`, `/api/v1/score/{domain}`, plan gate on `/api/v1/citations/{domain}`.
