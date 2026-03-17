"""
Push ingest — receives structured page data from the galuli.js snippet.
Replaces crawl-on-demand for sites with the snippet installed.

POST /api/v1/push          ← called by galuli.js on every page load
GET  /api/v1/geo/{domain}  ← per-LLM GEO citation readiness score

Score/badge endpoints live in score.py (prefix /api/v1/score).
"""
import hashlib
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel

from app.api.limiter import limiter
from app.services.storage import StorageService
from app.services.score import calculate_score

logger = logging.getLogger(__name__)
router = APIRouter()
storage = StorageService()


# ── Push payload schema ───────────────────────────────────────────────────

class PageData(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    page_type: Optional[str] = None     # homepage|pricing|docs|blog|product|contact|other
    headings: Optional[List[str]] = []
    ctas: Optional[List[str]] = []
    forms: Optional[List[Dict]] = []
    schema_org: Optional[List[Dict]] = []
    text_preview: Optional[str] = None  # first 2000 chars of clean text
    webmcp_tools: Optional[List[Dict]] = []  # tools registered via WebMCP
    webmcp_supported: Optional[bool] = False


class PushPayload(BaseModel):
    domain: str
    tenant_key: str                      # the customer's API key
    page: PageData
    content_hash: Optional[str] = None  # SHA256 of text — skip if unchanged
    snippet_version: str = "1.0.0"


class PushResponse(BaseModel):
    status: str                          # "accepted" | "skipped" | "queued"
    domain: str
    message: str
    score: Optional[Dict] = None


# ── Push endpoint ─────────────────────────────────────────────────────────

@router.post("/push", response_model=PushResponse)
@limiter.limit("30/minute")
async def push_page(request: Request, payload: PushPayload, background_tasks: BackgroundTasks):
    """
    Called by galui.js on every page load.
    Receives page structure + content, updates registry asynchronously.
    Returns current AI Readiness Score.
    """
    from app.config import settings
    from app.services.tenant import TenantService

    domain = payload.domain.replace("www.", "").lower().strip()

    # Verify tenant key
    tenant_svc = TenantService()
    tenant = tenant_svc.get_tenant(payload.tenant_key)
    if not tenant:
        raise HTTPException(status_code=401, detail="Invalid tenant key — get your key at galuli dashboard")

    # Check domain is allowed for this tenant (auto-registers up to plan limit)
    if not tenant_svc.is_domain_allowed(payload.tenant_key, domain):
        raise HTTPException(
            status_code=403,
            detail=f"Domain '{domain}' not allowed on this plan. "
                   f"Upgrade or remove another domain at your Galuli dashboard."
        )

    # Track usage
    tenant_svc.record_request(payload.tenant_key, "/api/v1/ingest/push", domain)

    # Check if content changed (hash comparison)
    page_hash = payload.content_hash or _hash_page(payload.page)
    last_hash = storage.get_page_hash(domain, payload.page.url)

    if last_hash == page_hash:
        # Content unchanged — return current score without re-processing
        registry = storage.get_registry(domain)
        score = calculate_score(registry.model_dump() if registry else {}) if registry else None
        return PushResponse(
            status="skipped",
            domain=domain,
            message="Content unchanged — no re-processing needed",
            score=score,
        )

    # Store hash + queue background pipeline
    storage.save_page_hash(domain, payload.page.url, page_hash)

    background_tasks.add_task(
        _run_push_pipeline,
        domain=domain,
        payload=payload,
        base_api_url=settings.base_api_url,
    )

    # Return current score while pipeline runs in background
    registry = storage.get_registry(domain)
    score = calculate_score(registry.model_dump() if registry else {}) if registry else None

    return PushResponse(
        status="accepted",
        domain=domain,
        message="Page accepted. Registry updating in background.",
        score=score,
    )


async def _run_push_pipeline(domain: str, payload: PushPayload, base_api_url: str):
    """
    Background: takes pushed page data, merges with existing registry,
    re-runs LLM comprehension if enough new data accumulated.
    """
    from app.services.comprehension import ComprehensionService
    from app.services.registry_builder import RegistryBuilder, calculate_confidence
    from app.models.crawl import CrawlResult, PageContent

    logger.info(f"[push] Processing {payload.page.url} for {domain}")

    try:
        # Build a minimal CrawlResult from the pushed page data
        page_text = _build_page_text(payload.page)
        page = PageContent(
            url=payload.page.url,
            title=payload.page.title or "",
            text=page_text,
            html="",
            status_code=200,
        )

        # Check if we have an existing registry to merge with
        existing = storage.get_registry(domain)

        # Build a CrawlResult with this page + any stored context
        crawl_result = CrawlResult(
            domain=domain,
            seed_url=f"https://{domain}",
            pages=[page],
            total_pages=1,
            duration=0.0,
            used_playwright=False,
        )

        # Run LLM comprehension
        comp = ComprehensionService()
        raw = await comp.extract(crawl_result)

        # Inject WebMCP data into ai_metadata
        raw["webmcp_tools_count"] = len(payload.page.webmcp_tools or [])
        raw["webmcp_enabled"] = payload.page.webmcp_supported or False
        raw["forms_exposed"] = len(payload.page.forms or [])

        # Build registry
        builder = RegistryBuilder()
        confidence = calculate_confidence(raw)
        registry = builder.build(
            domain=domain,
            raw=raw,
            confidence_score=confidence,
            base_api_url=base_api_url,
            webmcp_meta={
                "tools_count": len(payload.page.webmcp_tools or []),
                "enabled": payload.page.webmcp_supported or False,
                "forms_exposed": len(payload.page.forms or []),
                "tools": payload.page.webmcp_tools or [],
            }
        )

        # If we have an existing registry, merge — don't overwrite good data
        if existing:
            registry = _merge_registries(existing, registry)

        storage.save_registry(registry)
        logger.info(f"[push] Registry updated for {domain} | confidence={confidence:.2f}")

    except Exception as e:
        logger.error(f"[push] Pipeline failed for {domain}: {e}", exc_info=True)


def _build_page_text(page: PageData) -> str:
    """Reconstruct clean text from structured page data for LLM input."""
    parts = []
    if page.title:
        parts.append(f"# {page.title}")
    if page.description:
        parts.append(f"{page.description}")
    if page.headings:
        parts.append("## Headings\n" + "\n".join(f"- {h}" for h in page.headings))
    if page.ctas:
        parts.append("## Calls to Action\n" + "\n".join(f"- {c}" for c in page.ctas))
    if page.forms:
        form_desc = []
        for f in page.forms:
            form_desc.append(f"- Form: {f.get('name','unnamed')} ({f.get('action','no action')})")
        parts.append("## Forms\n" + "\n".join(form_desc))
    if page.schema_org:
        import json
        parts.append("## Schema.org\n" + json.dumps(page.schema_org, indent=2)[:2000])
    if page.text_preview:
        parts.append("## Content\n" + page.text_preview)
    return "\n\n".join(parts)


def _hash_page(page: PageData) -> str:
    """SHA256 of page content for change detection."""
    content = (page.text_preview or "") + (page.title or "") + str(page.headings)
    return hashlib.sha256(content.encode()).hexdigest()


def _merge_registries(existing, new):
    """
    Merge new registry data into existing, preserving good existing data.
    New data wins on most fields, but we keep existing capabilities if new has fewer.
    """
    # Keep existing capabilities if new extraction found fewer
    if (existing.capabilities and new.capabilities and
            len(existing.capabilities) > len(new.capabilities)):
        new.capabilities = existing.capabilities

    # Keep existing pricing if new has no tiers
    if (existing.pricing and new.pricing and
            not new.pricing.tiers and existing.pricing.tiers):
        new.pricing = existing.pricing

    # Keep best confidence score
    if existing.ai_metadata.confidence_score > new.ai_metadata.confidence_score:
        new.ai_metadata.confidence_score = existing.ai_metadata.confidence_score

    return new


# ── GEO endpoint ──────────────────────────────────────────────────────────

@router.get("/geo/{domain}", summary="GEO (Generative Engine Optimization) Score")
@limiter.limit("30/minute")
async def get_geo_score(request: Request, domain: str):
    """
    Per-LLM citation readiness score: how likely is each major AI to cite your site?
    Returns scores for ChatGPT, Perplexity, Claude, Gemini, Grok, and Llama.
    """
    from app.services.geo import calculate_geo_score
    domain = domain.replace("www.", "").lower().strip()
    registry = storage.get_registry(domain)
    if not registry:
        raise HTTPException(
            status_code=404,
            detail=f"No registry for '{domain}'. Install the Galuli snippet first."
        )
    return calculate_geo_score(registry.model_dump())
