"""
Entity Establishment endpoint — Layer 1 of The Stack.

GET /api/v1/entity/{domain}  — live entity check, no prior crawl needed, always public.

Based on research across 88 sources: entity resolution happens BEFORE retrieval.
No entity = no citation path, regardless of content quality.
"""
import logging

from fastapi import APIRouter, HTTPException

from app.services.entity_checker import check_entity

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{domain}", summary="Entity Establishment check — Layer 1 of The Stack")
async def get_entity(domain: str):
    """
    Checks whether a domain is a resolved entity across the sources AI systems
    use for entity resolution (knowledge graph layer).

    Checks performed (all external — no install needed):
    - Schema.org Organization markup (K mechanism)
    - FAQPage schema markup (K + R mechanisms)
    - Wikidata entity presence (K mechanism)
    - robots.txt AI crawler access (R mechanism)
    - Directory platform links on homepage (K mechanism)

    Returns per-check status (pass/warn/fail), fix URLs, and L1 score (0–35).
    No account or snippet required.
    """
    domain = domain.replace("www.", "").lower().strip()
    if not domain or "." not in domain:
        raise HTTPException(status_code=400, detail="Invalid domain")

    try:
        return await check_entity(domain)
    except Exception as e:
        logger.error(f"Entity check failed for {domain}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Entity check failed")
