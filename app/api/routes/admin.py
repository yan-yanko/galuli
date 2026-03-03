import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel

from app.services.storage import StorageService
from app.api.routes.ingest import _run_ingestion_pipeline

logger = logging.getLogger(__name__)
router = APIRouter()
storage = StorageService()


class RefreshRequest(BaseModel):
    domain: str


@router.post("/refresh", summary="Trigger re-crawl for a domain")
async def refresh_registry(req: RefreshRequest, background_tasks: BackgroundTasks):
    """Re-crawl and update the registry for an existing domain."""
    import uuid
    from datetime import datetime
    from app.models.jobs import IngestJob, JobStatus
    from app.config import settings

    domain = req.domain.replace("www.", "").lower().strip()
    existing = storage.get_registry(domain)
    if not existing:
        raise HTTPException(status_code=404, detail=f"No registry for '{domain}'. Ingest it first.")

    url = existing.metadata.website_url or f"https://{domain}"
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    job = IngestJob(
        job_id=job_id,
        domain=domain,
        url=url,
        status=JobStatus.PENDING,
        created_at=datetime.utcnow(),
    )
    storage.save_job(job)

    background_tasks.add_task(
        _run_ingestion_pipeline,
        job_id=job_id,
        url=url,
        domain=domain,
        use_playwright=False,
    )

    return {
        "job_id": job_id,
        "domain": domain,
        "status": "refresh_queued",
        "poll_url": f"{settings.base_api_url}/api/v1/jobs/{job_id}",
    }


@router.delete("/registry/{domain}", summary="Delete a registry")
async def delete_registry(domain: str):
    """Remove a domain's registry from the index."""
    domain = domain.replace("www.", "").lower().strip()
    deleted = storage.delete_registry(domain)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"No registry for '{domain}'")
    return {"deleted": domain, "status": "ok"}


@router.delete("/wipe-all", summary="Wipe all registries and jobs from the database")
async def wipe_all(request: Request):
    """
    Delete every registry, ingest job, crawl schedule, and page hash from the DB.
    Requires the master REGISTRY_API_KEY header when auth is enabled.
    """
    from app.config import settings
    if settings.registry_api_key:
        api_key = request.headers.get("X-API-Key", "")
        if api_key != settings.registry_api_key:
            raise HTTPException(
                status_code=403,
                detail="Master key required. Set X-API-Key header with your REGISTRY_API_KEY.",
            )

    tables = ["registries", "ingest_jobs", "crawl_schedule", "page_hashes"]
    with storage._get_conn() as conn:
        for table in tables:
            try:
                conn.execute(f"DELETE FROM {table}")
            except Exception:
                pass  # table may not exist yet
        conn.commit()
    return {"status": "ok", "message": "All data wiped"}


@router.get("/stats", summary="Registry index statistics")
async def get_stats():
    """Index-level statistics."""
    registries = storage.list_registries()
    jobs = storage.list_jobs(limit=100)

    job_counts = {}
    for j in jobs:
        s = j.get("status", "unknown")
        job_counts[s] = job_counts.get(s, 0) + 1

    return {
        "registries_indexed": len(registries),
        "jobs": job_counts,
        "recent_domains": [r["domain"] for r in registries[:10]],
    }
