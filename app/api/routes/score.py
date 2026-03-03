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
    Derive an AI Readiness Score (0-100) from the registry.

    5 dimensions:
      1. Content Coverage   (0-25) — number of capabilities documented
      2. Structure Quality  (0-20) — schema completeness (pricing, integration, reliability)
      3. Machine Signals    (0-20) — llms.txt, ai-plugin.json, WebMCP, confidence score
      4. Authority          (0-20) — docs URL, support URL, pricing page, SLA
      5. Freshness          (0-15) — pages crawled + source

    Returns dict with total, grade, label, dimensions.
    """
    # 1. Content Coverage (0-25)
    cap_count = len(registry.capabilities)
    cap_score = min(25, round(cap_count / 5 * 25))

    # 2. Structure Quality (0-20)
    struct_points = 0
    p = registry.pricing
    if p.model and p.model != "unknown":
        struct_points += 4
    if p.tiers:
        struct_points += 4
    i = registry.integration
    if i.api_base_url:
        struct_points += 4
    if i.auth_methods:
        struct_points += 4
    if i.sdks:
        struct_points += 4
    struct_score = min(20, struct_points)

    # 3. Machine Signals (0-25 raw → capped at 20)
    # Includes: llms.txt, ai-plugin, WebMCP, confidence, robots.txt, schema.org
    ai = registry.ai_metadata
    sig_points = 0
    if ai.llms_txt_url:
        sig_points += 5
    if ai.ai_plugin_url:
        sig_points += 3
    if ai.webmcp_enabled:
        sig_points += 5
    # confidence_score is 0.0-1.0
    sig_points += round(ai.confidence_score * 4)
    # Robots.txt: not blocking high-impact AI crawlers = +3 bonus
    if ai.robots_has_robots_txt and not ai.robots_blocks_ai_crawlers:
        sig_points += 3
    elif not ai.robots_has_robots_txt:
        sig_points += 1  # no robots.txt = neutral (permissive by default)
    # Schema.org: structured entity context for AI grounding
    if ai.schema_org_has_organization:
        sig_points += 2
    if ai.schema_org_has_faq:
        sig_points += 2
    machine_score = min(20, sig_points)

    # 4. Authority (0-20)
    auth_points = 0
    m = registry.metadata
    if m.docs_url:
        auth_points += 5
    if m.support_url:
        auth_points += 4
    if p.pricing_page_url:
        auth_points += 4
    if registry.reliability.status_page_url:
        auth_points += 4
    if m.description and len(m.description) > 80:
        auth_points += 3
    auth_score = min(20, auth_points)

    # 5. Freshness (0-15)
    fresh_points = 0
    pages = ai.pages_crawled
    if pages >= 10:
        fresh_points += 8
    elif pages >= 5:
        fresh_points += 5
    elif pages >= 1:
        fresh_points += 2
    if ai.source == "push":
        fresh_points += 7   # snippet-monitored = real-time
    else:
        fresh_points += 4   # crawl-based
    fresh_score = min(15, fresh_points)

    total = cap_score + struct_score + machine_score + auth_score + fresh_score

    if total >= 85:
        grade, label = "A", "Excellent AI Visibility"
    elif total >= 70:
        grade, label = "B", "Good AI Visibility"
    elif total >= 55:
        grade, label = "C", "Fair AI Visibility"
    elif total >= 40:
        grade, label = "D", "Needs Improvement"
    else:
        grade, label = "F", "Poor AI Visibility"

    return {
        "total": total,
        "grade": grade,
        "label": label,
        "dimensions": {
            "Content Coverage":   {"score": cap_score,     "max": 25},
            "Structure Quality":  {"score": struct_score,  "max": 20},
            "Machine Signals":    {"score": machine_score, "max": 20},
            "Authority":          {"score": auth_score,    "max": 20},
            "Freshness":          {"score": fresh_score,   "max": 15},
        },
        "suggestions": _suggestions(registry, cap_score, struct_score, machine_score, auth_score),
        "confidence": round(ai.confidence_score, 2),
        "pages_crawled": pages,
        "source": ai.source,
    }


def _suggestions(registry, cap, struct, machine, auth) -> list:
    tips = []
    if cap < 15:
        tips.append("Add more detailed capability descriptions to improve AI understanding")
    if struct < 12:
        tips.append("Document your API base URL, auth methods, and SDK availability")
    if machine < 12:
        ai = registry.ai_metadata
        if not ai.llms_txt_url:
            tips.append("Create a /llms.txt file to give AI systems a direct summary of your product")
        if not ai.webmcp_enabled:
            tips.append("Register via WebMCP so AI agents can directly discover your capabilities")
        if not ai.ai_plugin_url:
            tips.append("Add an /ai-plugin.json manifest for ChatGPT-compatible agent discovery")
    if auth < 12:
        m = registry.metadata
        if not m.docs_url:
            tips.append("Add a docs URL so AI systems can reference your documentation")
        if not m.support_url:
            tips.append("Add a support URL to signal trustworthiness to AI systems")
    # Robots.txt tip
    ai = registry.ai_metadata
    if ai.robots_blocks_ai_crawlers and len(tips) < 4:
        blocked = ", ".join(ai.robots_blocked_crawlers[:3])
        tips.insert(0, f"Your robots.txt is blocking AI crawlers ({blocked}) — they cannot index your site")
    # Schema.org tips
    if not ai.schema_org_has_organization and len(tips) < 4:
        tips.append("Add Organization schema.org JSON-LD so AI engines know your company's entity")
    if not ai.schema_org_has_faq and len(tips) < 4:
        tips.append("Add FAQPage schema.org markup — FAQ structured data is cited 3x more often by AI")
    if not tips:
        tips.append("Strong AI readiness! Install the Galuli snippet for continuous monitoring")
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
