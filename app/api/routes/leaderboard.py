"""
Leaderboard route — ranked list of scanned domains by AI Readiness Score.

GET /api/v1/leaderboard?category=&limit=50&offset=0
"""
import logging
from fastapi import APIRouter, Request
from typing import Optional

from app.api.limiter import limiter
from app.services.storage import StorageService
from app.services.score import compute_score
from app.services import cache

logger = logging.getLogger(__name__)
router = APIRouter()

CACHE_KEY = "leaderboard:all"
CACHE_TTL = 3600  # 1 hour


def _build_leaderboard() -> dict:
    """Compute scores for all indexed domains. Cached for 1 hour."""
    cached = cache.get(CACHE_KEY)
    if cached:
        return cached

    storage = StorageService()
    domains = storage.list_registries()
    entries = []
    categories = set()

    for row in domains:
        domain = row["domain"]
        try:
            registry = storage.get_registry(domain)
            if not registry:
                continue
            score = compute_score(registry)
            category = getattr(registry.metadata, "category", None) or "Other"
            if category in ("unknown", "other", ""):
                category = "Other"
            categories.add(category)
            entries.append({
                "domain": domain,
                "score": score["total"],
                "grade": score["grade"],
                "label": score["label"],
                "category": category,
                "pages_crawled": score.get("pages_crawled", 0),
                "updated_at": row.get("updated_at", ""),
            })
        except Exception as e:
            logger.warning(f"Leaderboard: failed to score {domain}: {e}")
            continue

    # Sort by score descending
    entries.sort(key=lambda x: (-x["score"], x["domain"]))

    # Assign ranks
    for i, entry in enumerate(entries):
        entry["rank"] = i + 1

    result = {
        "entries": entries,
        "total": len(entries),
        "categories": sorted(categories),
    }
    cache.set(CACHE_KEY, result, ttl=CACHE_TTL)
    return result


@router.get("/leaderboard", summary="AI Readiness Leaderboard")
@limiter.limit("20/minute")
async def get_leaderboard(
    request: Request,
    category: Optional[str] = None,
    sort: Optional[str] = "score",
    limit: int = 50,
    offset: int = 0,
):
    """
    Returns a ranked leaderboard of all scanned domains.

    Query params:
    - category: filter by category (e.g., "Developer Tools")
    - sort: "score" (default) or "recent"
    - limit: max results (default 50, max 200)
    - offset: pagination offset
    """
    limit = min(limit, 200)
    data = _build_leaderboard()

    entries = data["entries"]

    # Filter by category
    if category:
        entries = [e for e in entries if e["category"].lower() == category.lower()]

    # Sort
    if sort == "recent":
        entries = sorted(entries, key=lambda x: x.get("updated_at", ""), reverse=True)
        for i, e in enumerate(entries):
            e["rank"] = i + 1

    total = len(entries)
    entries = entries[offset:offset + limit]

    return {
        "entries": entries,
        "total": total,
        "categories": data["categories"],
        "offset": offset,
        "limit": limit,
    }
