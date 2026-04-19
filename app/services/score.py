"""
AI Readiness Score — shared computation.

Used by:
  - app/api/routes/score.py (per-domain endpoint)
  - app/api/routes/leaderboard.py (batch computation)

3 dimensions mapped to The Stack framework:
  1. Entity Establishment  (0-35) — L1: Schema.org, robots.txt, identity
  2. Content Retrieval     (0-40) — L4: Pages, capabilities, AI comprehension
  3. Freshness             (0-25) — How current is the data?
"""
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def compute_score(registry) -> dict:
    """
    AI Visibility Score (0-100) built on The Stack framework.
    Accepts a CapabilityRegistry Pydantic model.
    """
    ai = registry.ai_metadata
    m = registry.metadata
    p = registry.pricing

    # ── 1. Entity Establishment (0-35) — L1 ─────────────────────────────────
    entity_pts = 0
    if ai.schema_org_has_organization:
        entity_pts += 10
    if ai.robots_has_robots_txt and not ai.robots_blocks_ai_crawlers:
        entity_pts += 8
    elif not ai.robots_has_robots_txt:
        entity_pts += 4
    if ai.schema_org_has_faq:
        entity_pts += 7
    if m.description and len(m.description) > 80:
        entity_pts += 5
    if m.docs_url or p.pricing_page_url:
        entity_pts += 5
    entity_score = min(entity_pts, 35)

    # ── 2. Content Retrieval (0-40) — L4 ────────────────────────────────────
    retrieval_pts = 0
    pages = ai.pages_crawled
    cap_count = len(registry.capabilities)
    conf = ai.confidence_score

    if pages >= 10:
        retrieval_pts += 13
    elif pages >= 5:
        retrieval_pts += 9
    elif pages >= 1:
        retrieval_pts += 4

    if cap_count >= 5:
        retrieval_pts += 13
    elif cap_count >= 2:
        retrieval_pts += 8
    elif cap_count >= 1:
        retrieval_pts += 4

    if conf >= 0.7:
        retrieval_pts += 10
    elif conf >= 0.4:
        retrieval_pts += 6
    elif conf > 0:
        retrieval_pts += 3

    if ai.source == "push":
        retrieval_pts += 4
    retrieval_score = min(retrieval_pts, 40)

    # ── 3. Freshness (0-25) ─────────────────────────────────────────────────
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

    # ── Total ────────────────────────────────────────────────────────────────
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
    m = registry.metadata
    p = registry.pricing

    if ai.robots_blocks_ai_crawlers:
        blocked = ", ".join(ai.robots_blocked_crawlers[:3])
        tips.insert(0, f"Critical: robots.txt is blocking AI crawlers ({blocked}) — they cannot index or cite your site")

    if not ai.schema_org_has_organization:
        tips.append("Add Organization schema.org JSON-LD — AI engines use this for entity resolution before retrieval")

    if not ai.schema_org_has_faq:
        tips.append("Add FAQPage schema.org markup — FAQ content is retrieved 3x more often by AI systems")

    if not m.description or len(m.description) <= 80:
        tips.append("Add a detailed description to your site — AI needs a clear entity identity to describe and recommend you")

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
