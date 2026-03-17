"""
Score routes — AI Readiness Score + embeddable SVG badge.

GET /api/v1/score/{domain}         ← full score data (JSON)
GET /api/v1/score/{domain}/badge   ← embeddable SVG badge
"""
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.services.storage import StorageService

logger = logging.getLogger(__name__)
router = APIRouter()


def _compute_score(registry) -> dict:
    """
    AI Visibility Score (0-100) built on The Stack framework.

    3 dimensions mapped to The Stack (4 layers, 3 mechanisms):
      1. Entity Establishment  (0-35) — L1: Are you a resolved entity?
                                        Schema.org, robots.txt, Wikidata proxy, description depth
      2. Content Retrieval     (0-40) — L4: Can your content be retrieved and cited?
                                        Pages crawled, capability density, AI comprehension score
      3. Freshness             (0-25) — How current is your data?

    Framework: https://www.linkedin.com/pulse/how-ai-visibility-actually-works
    Research across 88 sources. Entity resolution happens BEFORE retrieval.
    """
    ai = registry.ai_metadata
    m  = registry.metadata
    p  = registry.pricing

    # ── 1. Entity Establishment (0-35) — L1 ──────────────────────────────────
    # K mechanism: Schema.org Organization (+10), robots.txt AI access (+8),
    # FAQPage schema (+7), clear description (+5), reference URLs (+5)
    entity_pts = 0

    if ai.schema_org_has_organization:
        entity_pts += 10   # AI can resolve who you are
    if ai.robots_has_robots_txt and not ai.robots_blocks_ai_crawlers:
        entity_pts += 8    # AI crawlers have verified access
    elif not ai.robots_has_robots_txt:
        entity_pts += 4    # permissive by default, unverified
    if ai.schema_org_has_faq:
        entity_pts += 7    # answer-shaped content = entity has expert knowledge
    if m.description and len(m.description) > 80:
        entity_pts += 5    # entity has a clear, detailed identity
    if m.docs_url or p.pricing_page_url:
        entity_pts += 5    # entity has canonical reference points AI can cite

    entity_score = min(entity_pts, 35)

    # ── 2. Content Retrieval (0-40) — L4 ─────────────────────────────────────
    # R mechanism: Retrieval surface (pages), content density (capabilities),
    # AI comprehension score (confidence), monitoring depth (push vs crawl)
    retrieval_pts = 0
    pages = ai.pages_crawled
    cap_count = len(registry.capabilities)
    conf = ai.confidence_score

    # Pages crawled = retrieval surface area (0-13pts)
    if pages >= 10:
        retrieval_pts += 13
    elif pages >= 5:
        retrieval_pts += 9
    elif pages >= 1:
        retrieval_pts += 4

    # Capability density = structured, answer-shaped content (0-13pts)
    if cap_count >= 5:
        retrieval_pts += 13
    elif cap_count >= 2:
        retrieval_pts += 8
    elif cap_count >= 1:
        retrieval_pts += 4

    # AI comprehension score = how well LLMs understand the content (0-10pts)
    if conf >= 0.7:
        retrieval_pts += 10
    elif conf >= 0.4:
        retrieval_pts += 6
    elif conf > 0:
        retrieval_pts += 3

    # Real-time monitoring via snippet = always-fresh retrieval surface (0-4pts)
    if ai.source == "push":
        retrieval_pts += 4

    retrieval_score = min(retrieval_pts, 40)

    # ── 3. Freshness (0-25) ───────────────────────────────────────────────────
    # Research: 76.4% of pages cited by AI were updated within 30 days
    from datetime import datetime
    fresh_pts = 0
    last_updated = ai.last_updated
    if last_updated:
        try:
            if isinstance(last_updated, str):
                last_updated = datetime.fromisoformat(last_updated.replace("Z", ""))
            age_days = (datetime.utcnow() - last_updated).days
            if age_days <= 1:
                fresh_pts = 25
            elif age_days <= 7:
                fresh_pts = 20
            elif age_days <= 30:
                fresh_pts = 13
            elif age_days <= 90:
                fresh_pts = 7
            else:
                fresh_pts = 2
        except Exception:
            fresh_pts = 0

    freshness_score = min(fresh_pts, 25)

    # ── Total ─────────────────────────────────────────────────────────────────
    total = entity_score + retrieval_score + freshness_score

    if total >= 85:
        grade, label = "A", "Strong AI Visibility"
    elif total >= 70:
        grade, label = "B", "Good AI Visibility"
    elif total >= 55:
        grade, label = "C", "Partial AI Visibility"
    elif total >= 40:
        grade, label = "D", "Weak AI Visibility"
    else:
        grade, label = "F", "Not Visible to AI"

    return {
        "total": total,
        "grade": grade,
        "label": label,
        "dimensions": {
            "Entity Establishment": {
                "score": entity_score,
                "max": 35,
                "layer": "L1",
                "description": "Are you a resolved entity? Schema.org, robots.txt, content identity.",
            },
            "Content Retrieval": {
                "score": retrieval_score,
                "max": 40,
                "layer": "L4",
                "description": "Can your content be retrieved and cited? Coverage, density, AI comprehension.",
            },
            "Freshness": {
                "score": freshness_score,
                "max": 25,
                "layer": "cross-layer",
                "description": "76.4% of AI-cited pages were updated within 30 days.",
            },
        },
        "suggestions": _suggestions(registry, entity_score, retrieval_score),
        "confidence": round(conf, 2),
        "pages_crawled": pages,
        "source": ai.source,
        "calculated_at": datetime.utcnow().isoformat(),
    }


def _suggestions(registry, entity_score: int, retrieval_score: int) -> list:
    """Prioritized fixes based on The Stack framework."""
    tips = []
    ai = registry.ai_metadata
    m  = registry.metadata
    p  = registry.pricing

    # L1: Entity Establishment fixes first (foundation layer — everything builds on it)
    if ai.robots_blocks_ai_crawlers:
        blocked = ", ".join(ai.robots_blocked_crawlers[:3])
        tips.insert(0, f"Critical: robots.txt is blocking AI crawlers ({blocked}) — they cannot index or cite your site")

    if not ai.schema_org_has_organization:
        tips.append("Add Organization schema.org JSON-LD — AI engines use this for entity resolution before retrieval")

    if not ai.schema_org_has_faq:
        tips.append("Add FAQPage schema.org markup — FAQ content is retrieved 3x more often by AI systems")

    if not m.description or len(m.description) <= 80:
        tips.append("Add a detailed description to your site — AI needs a clear entity identity to describe and recommend you")

    # L4: Content Retrieval fixes
    if ai.pages_crawled < 5:
        tips.append("Low page coverage — check robots.txt allows GPTBot and ClaudeBot, then re-scan")

    cap_count = len(registry.capabilities)
    if cap_count < 2:
        tips.append("Add a clear Features or How It Works page — structured capability content is cited more reliably")

    if not m.docs_url and not p.pricing_page_url:
        tips.append("Add a /pricing or /docs page — canonical reference URLs help AI engines cite you accurately")

    if not tips:
        tips.append("Strong entity establishment. Run the Entity Check tool for a live directory audit.")

    return tips[:4]


def _grade_color(grade: str) -> tuple:
    """Returns (fill_color, text_color) for SVG badge."""
    colors = {
        "A": ("#22c55e", "#ffffff"),   # green
        "B": ("#3b82f6", "#ffffff"),   # blue
        "C": ("#f59e0b", "#ffffff"),   # amber
        "D": ("#f97316", "#ffffff"),   # orange
        "F": ("#ef4444", "#ffffff"),   # red
    }
    return colors.get(grade, ("#6b7280", "#ffffff"))


def _make_badge_svg(domain: str, score: int, grade: str, label: str) -> str:
    """Generate an embeddable SVG badge showing domain + AI Readiness Score."""
    fill_color, _ = _grade_color(grade)
    # Arc for score ring (cx=34, cy=34, r=26)
    cx, cy, r = 34, 34, 26
    circumference = 2 * 3.14159 * r
    progress = max(0.0, min(1.0, score / 100))
    dash_fill = circumference * progress
    dash_gap = circumference - dash_fill

    # Truncate long domains
    display_domain = domain if len(domain) <= 22 else domain[:20] + "…"

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="220" height="80" viewBox="0 0 220 80" role="img" aria-label="Galuli AI Readiness Score: {score}/100 for {domain}">
  <title>Galuli AI Readiness Score: {score}/100</title>
  <defs>
    <style>
      .bg {{ fill: #0f172a; }}
      .ring-bg {{ fill: none; stroke: #1e293b; stroke-width: 5; }}
      .ring {{ fill: none; stroke: {fill_color}; stroke-width: 5; stroke-linecap: round;
               stroke-dasharray: {dash_fill:.1f} {dash_gap:.1f};
               transform: rotate(-90deg); transform-origin: {cx}px {cy}px; }}
      .score-num {{ font-family: -apple-system, sans-serif; font-weight: 800; font-size: 15px; fill: #f8fafc; text-anchor: middle; dominant-baseline: middle; }}
      .grade {{ font-family: -apple-system, sans-serif; font-weight: 700; font-size: 9px; fill: {fill_color}; text-anchor: middle; dominant-baseline: middle; }}
      .label {{ font-family: -apple-system, sans-serif; font-weight: 600; font-size: 10px; fill: #94a3b8; }}
      .domain {{ font-family: -apple-system, sans-serif; font-weight: 700; font-size: 11px; fill: #f8fafc; }}
      .brand {{ font-family: -apple-system, sans-serif; font-weight: 800; font-size: 9px; fill: #6366f1; }}
      .border {{ fill: none; stroke: #1e293b; stroke-width: 1; rx: 8; }}
    </style>
  </defs>
  <rect width="220" height="80" rx="10" class="bg"/>
  <rect width="220" height="80" rx="10" class="border"/>

  <!-- Score ring -->
  <circle cx="{cx}" cy="{cy}" r="{r}" class="ring-bg"/>
  <circle cx="{cx}" cy="{cy}" r="{r}" class="ring"/>
  <text x="{cx}" y="{cy - 4}" class="score-num">{score}</text>
  <text x="{cx}" y="{cy + 11}" class="grade">{grade}</text>

  <!-- Right side text -->
  <text x="78" y="18" class="brand">⬡ galuli</text>
  <text x="78" y="34" class="domain">{display_domain}</text>
  <text x="78" y="50" class="label">AI Readiness Score</text>
  <text x="78" y="66" class="label" style="fill: {fill_color}; font-weight: 700;">{label}</text>
</svg>"""
    return svg


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/{domain}", summary="AI Readiness Score for a domain")
async def get_score(domain: str):
    """
    Returns the computed AI Readiness Score (0-100) for an indexed domain.

    Includes:
    - total score and grade
    - 5 dimension breakdown (Content Coverage, Structure Quality, Machine Signals, Authority, Freshness)
    - improvement suggestions
    - confidence + pages crawled metadata
    """
    domain = domain.replace("www.", "").lower().strip()
    storage = StorageService()
    registry = storage.get_registry(domain)
    if not registry:
        raise HTTPException(
            status_code=404,
            detail={
                "error": f"No registry found for '{domain}'",
                "hint": "POST /api/v1/ingest with the site URL to scan it first",
            },
        )
    score = _compute_score(registry)
    return {"domain": domain, **score}


@router.get("/{domain}/suggestions", summary="Improvement suggestions for AI Readiness Score")
async def get_suggestions(domain: str):
    """
    Prioritized list of actions to improve the AI Readiness Score.
    Same suggestions already embedded in the GET /{domain} response.
    Provided as a separate endpoint for dashboard convenience.
    """
    domain = domain.replace("www.", "").lower().strip()
    storage = StorageService()
    registry = storage.get_registry(domain)
    if not registry:
        raise HTTPException(status_code=404, detail=f"No registry for '{domain}'")
    score = _compute_score(registry)
    return {
        "domain": domain,
        "score": score["total"],
        "grade": score["grade"],
        "suggestions": score["suggestions"],
    }


@router.get("/{domain}/badge", summary="Embeddable SVG badge for AI Readiness Score")
async def get_badge(domain: str):
    """
    Returns an embeddable SVG badge showing the AI Readiness Score.

    Embed with:
      <img src="https://galuli.io/api/v1/score/{domain}/badge" alt="AI Readiness Score" />

    Or as a link:
      <a href="https://galuli.io">
        <img src="https://galuli.io/api/v1/score/{domain}/badge" alt="AI Readiness" />
      </a>
    """
    domain = domain.replace("www.", "").lower().strip()
    storage = StorageService()
    registry = storage.get_registry(domain)
    if not registry:
        raise HTTPException(status_code=404, detail=f"No registry for '{domain}'")

    score = _compute_score(registry)
    svg = _make_badge_svg(domain, score["total"], score["grade"], score["label"])

    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=300",
            "X-Score": str(score["total"]),
            "X-Grade": score["grade"],
        },
    )
