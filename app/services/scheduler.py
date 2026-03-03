"""
Auto-refresh scheduler.

Uses APScheduler to re-crawl registered domains on a schedule.
Default: every 7 days per domain (configurable).

Integrated into FastAPI lifespan — starts on app boot, stops on shutdown.
"""
import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

_scheduler = None


def start_scheduler():
    """Start the background refresh scheduler. Called from app lifespan."""
    global _scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.interval import IntervalTrigger

        _scheduler = BackgroundScheduler(daemon=True)
        _scheduler.add_job(
            _refresh_stale_domains,
            trigger=IntervalTrigger(hours=6),  # Check every 6h, re-crawl if >7d stale
            id="refresh_stale_domains",
            replace_existing=True,
            next_run_time=datetime.utcnow() + timedelta(minutes=2),  # First run 2min after boot
        )
        _scheduler.add_job(
            _run_citation_checks,
            trigger=IntervalTrigger(weeks=1),  # Weekly citation checks for Pro users
            id="weekly_citation_checks",
            replace_existing=True,
            next_run_time=datetime.utcnow() + timedelta(hours=1),  # First run 1h after boot
        )
        from apscheduler.triggers.cron import CronTrigger
        _scheduler.add_job(
            _reset_daily_usage,
            trigger=CronTrigger(hour=0, minute=0, timezone="UTC"),  # Daily at midnight UTC
            id="reset_daily_usage",
            replace_existing=True,
        )
        _scheduler.start()
        logger.info("Auto-refresh scheduler started (checks every 6h, re-crawls if >7d stale)")
        logger.info("Citation check scheduler started (weekly, Pro tenants)")
        logger.info("Daily usage reset scheduler started (midnight UTC)")
    except ImportError:
        logger.warning("APScheduler not installed — auto-refresh disabled. pip install apscheduler")
    except Exception as e:
        logger.error(f"Scheduler failed to start: {e}")


def stop_scheduler():
    """Stop scheduler. Called from app lifespan shutdown."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Auto-refresh scheduler stopped")


def _refresh_stale_domains():
    """
    Find domains not crawled in >7 days and re-queue them.
    Runs in background thread — uses asyncio.run() for async pipeline.
    """
    import asyncio
    from app.services.storage import StorageService
    from app.config import settings

    try:
        storage = StorageService()
        registries = storage.list_registries()
        stale_threshold = datetime.utcnow() - timedelta(hours=settings.auto_refresh_interval_hours)

        stale = []
        for r in registries:
            updated_at = datetime.fromisoformat(r["updated_at"])
            if updated_at < stale_threshold:
                stale.append(r["domain"])

        if not stale:
            logger.debug("No stale domains to refresh")
            return

        logger.info(f"Refreshing {len(stale)} stale domains: {stale}")

        for domain in stale:
            try:
                asyncio.run(_refresh_one(domain, storage, settings))
            except Exception as e:
                logger.error(f"Auto-refresh failed for {domain}: {e}")

    except Exception as e:
        logger.error(f"Refresh job error: {e}", exc_info=True)


async def _refresh_one(domain: str, storage, settings):
    """Re-run the full ingestion pipeline for one domain."""
    import uuid
    from datetime import datetime
    from app.models.jobs import IngestJob, JobStatus
    from app.services.crawler import CrawlerService
    from app.services.comprehension import ComprehensionService
    from app.services.registry_builder import RegistryBuilder, calculate_confidence

    existing = storage.get_registry(domain)
    if not existing:
        return

    url = existing.metadata.website_url or f"https://{domain}"
    job_id = f"auto_{uuid.uuid4().hex[:8]}"

    job = IngestJob(
        job_id=job_id,
        domain=domain,
        url=url,
        status=JobStatus.CRAWLING,
        created_at=datetime.utcnow(),
    )
    storage.save_job(job)

    try:
        crawler = CrawlerService()
        crawl = await crawler.crawl(url)

        job.status = JobStatus.COMPREHENDING
        storage.save_job(job)

        comp = ComprehensionService()
        raw = await comp.extract(crawl)

        confidence = calculate_confidence(raw)
        rb = RegistryBuilder()
        registry = rb.build(domain, raw, confidence, settings.base_api_url)

        storage.save_registry(registry)

        job.status = JobStatus.COMPLETE
        job.completed_at = datetime.utcnow()
        job.confidence_score = confidence
        job.pages_crawled = crawl.total_pages
        storage.save_job(job)

        logger.info(f"Auto-refreshed {domain} (confidence={confidence})")

    except Exception as e:
        job.status = JobStatus.FAILED
        job.error = str(e)
        job.completed_at = datetime.utcnow()
        storage.save_job(job)
        raise


def _reset_daily_usage():
    """
    Midnight UTC: reset requests_today = 0 for all tenants.
    Ensures daily rate limits actually reset each day.
    """
    from app.services.tenant import TenantService
    try:
        TenantService().reset_daily_usage()
    except Exception as e:
        logger.error(f"Daily usage reset job error: {e}", exc_info=True)


def _run_citation_checks():
    """
    Weekly: run citation checks for all Pro+ tenants with configured queries.
    Same pattern as _refresh_stale_domains — sync wrapper using asyncio.run().
    """
    import asyncio
    from app.services.tenant import TenantService
    from app.services.citation_tracker import CitationService

    try:
        ts = TenantService()
        cs = CitationService()

        all_tenants = ts.list_tenants()
        pro_tenants = [t for t in all_tenants if getattr(t, "plan", "free") in ("pro", "agency", "enterprise")]

        logger.info(f"Weekly citation check: {len(pro_tenants)} Pro+ tenants")

        for tenant in pro_tenants:
            api_key = tenant.api_key
            try:
                domains = ts.get_tenant_domains(api_key)
            except Exception:
                continue

            for domain in domains:
                queries = cs.list_queries(api_key, domain)
                if not queries:
                    continue
                try:
                    asyncio.run(cs.run_check(api_key, domain))
                    logger.info(f"Citation check done: {domain} ({getattr(tenant, 'email', '?')})")
                except Exception as e:
                    logger.error(f"Citation check failed for {domain}: {e}")

    except Exception as e:
        logger.error(f"Weekly citation check job error: {e}", exc_info=True)
