"""
Citation Tracker API routes — Pro only.

GET    /api/v1/citations/{domain}/queries        list tracked queries
POST   /api/v1/citations/{domain}/queries        add keyword or question
DELETE /api/v1/citations/{domain}/queries/{id}   remove a query
POST   /api/v1/citations/{domain}/check          trigger a check run (async)
GET    /api/v1/citations/{domain}/results        latest results per (query, engine)
GET    /api/v1/citations/{domain}/trend          weekly citation counts (4 weeks)
GET    /api/v1/citations/{domain}/history        past check runs with summary
"""

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel

from app.services.citation_tracker import CitationService

logger = logging.getLogger(__name__)
router = APIRouter()
_svc = CitationService()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _require_pro(request: Request) -> str:
    """Returns api_key. Requires Pro, Agency, or Enterprise plan."""
    tenant = getattr(request.state, "tenant", None)
    api_key = getattr(request.state, "api_key", None)

    # Master key bypass (admin/internal use)
    if not tenant and api_key:
        return api_key

    if not tenant:
        raise HTTPException(
            status_code=403,
            detail="Authentication required. Add your API key via X-API-Key header.",
        )
    if tenant.plan not in ("pro", "agency", "enterprise"):
        raise HTTPException(
            status_code=403,
            detail="Citation Tracker requires a Pro plan. Upgrade at galuli.io/dashboard/#settings",
        )
    return tenant.api_key


def _norm(domain: str) -> str:
    return domain.replace("www.", "").lower().strip()


# ── Pydantic models ────────────────────────────────────────────────────────────

class AddQueryRequest(BaseModel):
    type: str = "keyword"   # "keyword" | "question"
    value: str


# ── Background task ────────────────────────────────────────────────────────────

async def _run_check_bg(api_key: str, domain: str, run_id: str):
    """Background task — runs the full citation check asynchronously."""
    try:
        svc = CitationService()
        result = await svc.run_check(api_key, domain)
        logger.info(f"Citation check bg complete: {domain} run={run_id} result={result}")
    except Exception as e:
        logger.error(f"Citation check bg failed: {domain} run={run_id} error={e}", exc_info=True)


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("/{domain}/queries", summary="List tracked keywords/questions")
async def list_queries(domain: str, request: Request):
    api_key = _require_pro(request)
    domain = _norm(domain)
    queries = _svc.list_queries(api_key, domain)

    # Annotate each query with its generated question (for display)
    for q in queries:
        if q["type"] == "question":
            q["generated_question"] = q["value"]
        else:
            q["generated_question"] = _svc._generate_question(q["value"])

    return {
        "domain": domain,
        "queries": queries,
        "count": len(queries),
        "max": _svc._settings.citation_max_queries,
    }


@router.post("/{domain}/queries", summary="Add a keyword or question to track")
async def add_query(domain: str, body: AddQueryRequest, request: Request):
    api_key = _require_pro(request)
    domain = _norm(domain)

    if body.type not in ("keyword", "question"):
        raise HTTPException(400, "type must be 'keyword' or 'question'")
    if not body.value or not body.value.strip():
        raise HTTPException(400, "value cannot be empty")

    max_q = _svc._settings.citation_max_queries
    if _svc.count_queries(api_key, domain) >= max_q:
        raise HTTPException(
            400,
            f"Maximum {max_q} queries per domain reached. Remove one to add another.",
        )

    row = _svc.add_query(api_key, domain, body.type, body.value)
    if row is None:
        raise HTTPException(409, "This keyword or question is already tracked for this domain.")

    row["generated_question"] = (
        row["value"] if row["type"] == "question"
        else _svc._generate_question(row["value"])
    )
    return row


@router.delete("/{domain}/queries/{query_id}", summary="Remove a tracked query")
async def remove_query(domain: str, query_id: int, request: Request):
    api_key = _require_pro(request)
    ok = _svc.remove_query(api_key, query_id)
    if not ok:
        raise HTTPException(404, "Query not found or not owned by this account.")
    return {"deleted": True, "query_id": query_id}


@router.post("/{domain}/check", summary="Trigger a citation check run")
async def trigger_check(domain: str, request: Request, background_tasks: BackgroundTasks):
    """
    Fires off a check run asynchronously (takes 15-45s).
    Returns run_id immediately — poll /history to see when complete.
    """
    api_key = _require_pro(request)
    domain = _norm(domain)

    if _svc.count_queries(api_key, domain) == 0:
        raise HTTPException(400, "No queries configured for this domain. Add keywords first.")

    run_id = uuid.uuid4().hex[:12]
    background_tasks.add_task(_run_check_bg, api_key, domain, run_id)

    engines = [e.__name__.replace("_query_", "") for e in _svc._get_enabled_engines()]
    return {
        "run_id": run_id,
        "status": "running",
        "domain": domain,
        "engines": engines,
        "message": "Check started. Poll /history to see results when complete (~30-60s).",
    }


@router.get("/{domain}/results", summary="Latest citation results per query and engine")
async def get_results(domain: str, request: Request):
    api_key = _require_pro(request)
    domain = _norm(domain)
    return _svc.get_latest_results(api_key, domain)


@router.get("/{domain}/trend", summary="Weekly citation counts (last 4 weeks)")
async def get_trend(domain: str, request: Request, weeks: int = 4):
    api_key = _require_pro(request)
    domain = _norm(domain)
    weeks = max(1, min(weeks, 12))  # cap at 12 weeks
    return _svc.get_trend(api_key, domain, weeks)


@router.get("/{domain}/history", summary="Past check runs with summary stats")
async def get_history(domain: str, request: Request, limit: int = 10):
    api_key = _require_pro(request)
    domain = _norm(domain)
    runs = _svc.get_run_history(api_key, domain, limit=limit)
    return {"domain": domain, "runs": runs}
