"""
Score routes — AI Readiness Score + embeddable SVG badge.

GET /api/v1/score/{domain}         <- full score data (JSON)
GET /api/v1/score/{domain}/badge   <- embeddable SVG badge
"""
import logging
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

from app.api.limiter import limiter
from app.services.storage import StorageService
from app.services.score import compute_score
from app.services import cache

logger = logging.getLogger(__name__)
router = APIRouter()


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
    from urllib.parse import quote
    fill_color, _ = _grade_color(grade)
    # Arc for score ring (cx=34, cy=34, r=26)
    cx, cy, r = 34, 34, 26
    circumference = 2 * 3.14159 * r
    progress = max(0.0, min(1.0, score / 100))
    dash_fill = circumference * progress
    dash_gap = circumference - dash_fill

    # Truncate long domains
    display_domain = domain if len(domain) <= 22 else domain[:20] + "…"

    link_url = f"https://galuli.io/?ref={quote(domain)}&amp;utm_source=badge&amp;utm_medium=embed&amp;utm_campaign=score_badge"

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="220" height="80" viewBox="0 0 220 80" role="img" aria-label="Galuli AI Readiness Score: {score}/100 for {domain}">
  <title>Galuli AI Readiness Score: {score}/100 — Click to check your site</title>
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
      .cta {{ font-family: -apple-system, sans-serif; font-weight: 600; font-size: 8px; fill: #6366f1; text-anchor: end; }}
    </style>
  </defs>
  <a xlink:href="{link_url}" target="_blank">
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
    <text x="212" y="72" class="cta">Check yours →</text>
  </a>
</svg>"""
    return svg


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/{domain}", summary="AI Readiness Score for a domain")
@limiter.limit("30/minute")
async def get_score(request: Request, domain: str):
    """
    Returns the computed AI Readiness Score (0-100) for an indexed domain.

    Includes:
    - total score and grade
    - 5 dimension breakdown (Content Coverage, Structure Quality, Machine Signals, Authority, Freshness)
    - improvement suggestions
    - confidence + pages crawled metadata
    """
    domain = domain.replace("www.", "").lower().strip()
    cached = cache.get(f"score:{domain}")
    if cached:
        return cached
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
    score = compute_score(registry)
    result = {"domain": domain, **score}
    cache.set(f"score:{domain}", result)
    return result


@router.get("/{domain}/suggestions", summary="Improvement suggestions for AI Readiness Score")
@limiter.limit("30/minute")
async def get_suggestions(request: Request, domain: str):
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
    score = compute_score(registry)
    return {
        "domain": domain,
        "score": score["total"],
        "grade": score["grade"],
        "suggestions": score["suggestions"],
    }


@router.get("/{domain}/badge", summary="Embeddable SVG badge for AI Readiness Score")
@limiter.limit("60/minute")
async def get_badge(request: Request, domain: str):
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
    cached_svg = cache.get(f"badge:{domain}")
    if cached_svg:
        return cached_svg
    storage = StorageService()
    registry = storage.get_registry(domain)
    if not registry:
        raise HTTPException(status_code=404, detail=f"No registry for '{domain}'")

    score = compute_score(registry)
    svg = _make_badge_svg(domain, score["total"], score["grade"], score["label"])

    response = Response(
        content=svg,
        media_type="image/svg+xml",
        headers={
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=300",
            "X-Score": str(score["total"]),
            "X-Grade": score["grade"],
        },
    )
    cache.set(f"badge:{domain}", response)
    return response
