import uuid
import logging
from datetime import datetime
from urllib.parse import urlparse

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel

from app.api.limiter import limiter

from app.models.jobs import IngestJob, JobStatus
from app.services.crawler import CrawlerService
from app.services.comprehension import ComprehensionService
from app.services.registry_builder import RegistryBuilder, calculate_confidence
from app.services.storage import StorageService
from app.services.robots_checker import RobotsChecker
from app.services.schema_checker import SchemaChecker

logger = logging.getLogger(__name__)
router = APIRouter()

storage = StorageService()
comprehension_service = ComprehensionService()
registry_builder = RegistryBuilder()


class IngestRequest(BaseModel):
    url: str
    force_refresh: bool = False
    use_playwright: bool = False
    max_pages: int = 0  # 0 = use server default (config.max_pages_per_crawl)


class IngestResponse(BaseModel):
    job_id: str
    domain: str
    status: str
    message: str
    registry_url: str
    poll_url: str


def _parse_domain(url: str) -> str:
    if not url.startswith("http"):
        url = f"https://{url}"
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "") or parsed.path.replace("www.", "").split("/")[0]
    return domain.lower().strip()


@router.post("/ingest", response_model=IngestResponse)
@limiter.limit("3/hour")
async def ingest_url(request: Request, req: IngestRequest, background_tasks: BackgroundTasks):
    """
    Trigger async ingestion of a domain.

    Returns immediately with job_id.
    Poll GET /api/v1/jobs/{job_id} for status.
    Full registry at GET /registry/{domain} when status=complete.
    """
    from app.config import settings

    domain = _parse_domain(req.url)
    if not domain:
        raise HTTPException(status_code=400, detail="Could not parse domain from URL")

    # Return cached if exists and not forcing refresh
    if not req.force_refresh:
        existing = storage.get_registry(domain)
        if existing:
            return IngestResponse(
                job_id="cached",
                domain=domain,
                status="complete",
                message="Registry already exists. Use force_refresh=true to re-crawl.",
                registry_url=f"{settings.base_api_url}/registry/{domain}",
                poll_url=f"{settings.base_api_url}/api/v1/jobs/cached",
            )

    job_id = f"job_{uuid.uuid4().hex[:12]}"
    job = IngestJob(
        job_id=job_id,
        domain=domain,
        url=req.url if req.url.startswith("http") else f"https://{req.url}",
        status=JobStatus.PENDING,
        created_at=datetime.utcnow(),
    )
    storage.save_job(job)

    background_tasks.add_task(
        _run_ingestion_pipeline,
        job_id=job_id,
        url=job.url,
        domain=domain,
        use_playwright=req.use_playwright,
        max_pages=req.max_pages or None,
    )

    return IngestResponse(
        job_id=job_id,
        domain=domain,
        status="pending",
        message="Ingestion started. Poll poll_url for status updates.",
        registry_url=f"{settings.base_api_url}/registry/{domain}",
        poll_url=f"{settings.base_api_url}/api/v1/jobs/{job_id}",
    )


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Poll ingestion job status."""
    if job_id == "cached":
        return {"job_id": "cached", "status": "complete", "message": "Served from cache"}

    job = storage.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs")
async def list_jobs(limit: int = 20):
    """List recent ingestion jobs."""
    return {"jobs": storage.list_jobs(limit=limit)}


async def _run_ingestion_pipeline(
    job_id: str, url: str, domain: str, use_playwright: bool, max_pages: int = None
):
    """
    Background pipeline: Crawl → Comprehend → Build → Store

    Each stage updates job status. Failures are caught and recorded.
    """
    job = storage.get_job(job_id)
    if not job:
        logger.error(f"Job {job_id} not found at pipeline start")
        return

    from app.config import settings

    try:
        # Stage 1: Crawl
        logger.info(f"[{job_id}] Stage 1: crawling {url}")
        job.status = JobStatus.CRAWLING
        storage.save_job(job)

        crawler = CrawlerService(use_playwright=use_playwright, max_pages=max_pages)
        crawl_result = await crawler.crawl(url)
        job.pages_crawled = crawl_result.total_pages
        logger.info(f"[{job_id}] Crawled {crawl_result.total_pages} pages")

        if crawl_result.total_pages == 0:
            raise ValueError("Crawler returned zero pages — site may be unreachable or JS-only")

        # Stage 1b: Robots.txt + Schema.org audit (parallel with crawl data)
        logger.info(f"[{job_id}] Stage 1b: robots.txt + schema audit")
        robots_result = {}
        schema_result = {}
        try:
            robots_checker = RobotsChecker()
            schema_checker = SchemaChecker()
            import asyncio
            robots_result, schema_result = await asyncio.gather(
                robots_checker.check(domain),
                schema_checker.check(domain),
                return_exceptions=True,
            )
            if isinstance(robots_result, Exception):
                logger.warning(f"[{job_id}] robots check failed: {robots_result}")
                robots_result = {}
            if isinstance(schema_result, Exception):
                logger.warning(f"[{job_id}] schema check failed: {schema_result}")
                schema_result = {}
        except Exception as e:
            logger.warning(f"[{job_id}] robots/schema audit error: {e}")

        # Stage 2: Comprehend
        logger.info(f"[{job_id}] Stage 2: comprehension (4 LLM passes)")
        job.status = JobStatus.COMPREHENDING
        storage.save_job(job)

        raw = await comprehension_service.extract(crawl_result)

        # Stage 3: Build registry
        logger.info(f"[{job_id}] Stage 3: building registry schema")
        confidence = calculate_confidence(raw)
        registry = registry_builder.build(
            domain=domain,
            raw=raw,
            confidence_score=confidence,
            base_api_url=settings.base_api_url,
            robots_result=robots_result,
            schema_result=schema_result,
        )

        # Stage 4: Store
        logger.info(f"[{job_id}] Stage 4: storing registry")
        job.status = JobStatus.STORING
        storage.save_job(job)

        storage.save_registry(registry)

        # Done
        job.status = JobStatus.COMPLETE
        job.completed_at = datetime.utcnow()
        job.confidence_score = confidence
        storage.save_job(job)

        logger.info(
            f"[{job_id}] Complete: {domain} | "
            f"pages={crawl_result.total_pages} | confidence={confidence}"
        )

    except Exception as e:
        logger.error(f"[{job_id}] Pipeline failed for {domain}: {e}", exc_info=True)
        job.status = JobStatus.FAILED
        job.error = str(e)
        job.completed_at = datetime.utcnow()
        storage.save_job(job)
