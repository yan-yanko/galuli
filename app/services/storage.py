import sqlite3
import json
import logging
import os
from datetime import datetime
from typing import Optional, List
from app.models.registry import CapabilityRegistry
from app.models.jobs import IngestJob, JobStatus

logger = logging.getLogger(__name__)

CREATE_REGISTRIES = """
CREATE TABLE IF NOT EXISTS registries (
    domain TEXT PRIMARY KEY,
    registry_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    crawl_id TEXT NOT NULL
)
"""

CREATE_JOBS = """
CREATE TABLE IF NOT EXISTS ingest_jobs (
    job_id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    error TEXT,
    pages_crawled INTEGER DEFAULT 0,
    confidence_score REAL DEFAULT 0.0
)
"""

CREATE_CRAWL_SCHEDULE = """
CREATE TABLE IF NOT EXISTS crawl_schedule (
    domain TEXT PRIMARY KEY,
    last_crawl TEXT NOT NULL,
    next_crawl TEXT NOT NULL,
    interval_hours INTEGER NOT NULL DEFAULT 168
)
"""

CREATE_PAGE_HASHES = """
CREATE TABLE IF NOT EXISTS page_hashes (
    domain   TEXT NOT NULL,
    page_url TEXT NOT NULL,
    hash     TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (domain, page_url)
)
"""

CREATE_PAGE_SNAPSHOTS = """
CREATE TABLE IF NOT EXISTS page_snapshots (
    domain       TEXT NOT NULL,
    page_path    TEXT NOT NULL,
    page_url     TEXT NOT NULL,
    title        TEXT NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    html_snapshot TEXT NOT NULL,
    text_content  TEXT NOT NULL DEFAULT '',
    headings_json TEXT NOT NULL DEFAULT '[]',
    updated_at   TEXT NOT NULL,
    PRIMARY KEY (domain, page_path)
)
"""


class StorageService:
    """
    SQLite storage for registries and job state.

    Upgrade path to Postgres: swap sqlite3 for asyncpg, keep same interface.
    All SQL is standard and compatible with Postgres without modification.
    """

    def __init__(self, db_path: str = None):
        if db_path is None:
            from app.config import settings
            db_path = settings.database_url
        self.db_path = db_path
        # Ensure data directory exists
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute(CREATE_REGISTRIES)
            conn.execute(CREATE_JOBS)
            conn.execute(CREATE_CRAWL_SCHEDULE)
            conn.execute(CREATE_PAGE_HASHES)
            conn.execute(CREATE_PAGE_SNAPSHOTS)
            conn.commit()
        logger.info(f"Storage initialized: {self.db_path}")

    # --- Registry ---

    def save_registry(self, registry: CapabilityRegistry):
        now = datetime.utcnow().isoformat()
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO registries (domain, registry_json, created_at, updated_at, crawl_id)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(domain) DO UPDATE SET
                    registry_json = excluded.registry_json,
                    updated_at = excluded.updated_at,
                    crawl_id = excluded.crawl_id
            """, (
                registry.domain,
                registry.model_dump_json(),
                now,
                now,
                registry.crawl_id,
            ))
            conn.commit()
        logger.info(f"Saved registry for {registry.domain}")

    def get_registry(self, domain: str) -> Optional[CapabilityRegistry]:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT registry_json FROM registries WHERE domain = ?", (domain,)
            ).fetchone()
            if not row:
                return None
            return CapabilityRegistry.model_validate_json(row["registry_json"])

    def list_registries(self) -> List[dict]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT domain, updated_at, crawl_id FROM registries ORDER BY updated_at DESC"
            ).fetchall()
            return [dict(r) for r in rows]

    def list_domains(self) -> List[str]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT domain FROM registries ORDER BY updated_at DESC"
            ).fetchall()
            return [r["domain"] for r in rows]

    def delete_registry(self, domain: str) -> bool:
        with self._get_conn() as conn:
            cursor = conn.execute("DELETE FROM registries WHERE domain = ?", (domain,))
            conn.commit()
            return cursor.rowcount > 0

    def erase_domains(self, domains: list):
        """
        Hard-delete registries, jobs, schedule, and hashes for a list of domains.
        Called by GDPR/HIPAA tenant erasure flow.
        """
        if not domains:
            return
        placeholders = ",".join("?" * len(domains))
        with self._get_conn() as conn:
            for table in ("registries", "ingest_jobs", "crawl_schedule", "page_hashes"):
                conn.execute(
                    f"DELETE FROM {table} WHERE domain IN ({placeholders})",
                    domains
                )
            conn.commit()

    # --- Jobs ---

    def save_job(self, job: IngestJob):
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO ingest_jobs
                    (job_id, domain, url, status, created_at, completed_at, error, pages_crawled, confidence_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(job_id) DO UPDATE SET
                    status = excluded.status,
                    completed_at = excluded.completed_at,
                    error = excluded.error,
                    pages_crawled = excluded.pages_crawled,
                    confidence_score = excluded.confidence_score
            """, (
                job.job_id,
                job.domain,
                job.url,
                job.status.value,
                job.created_at.isoformat(),
                job.completed_at.isoformat() if job.completed_at else None,
                job.error,
                job.pages_crawled,
                job.confidence_score,
            ))
            conn.commit()

    def get_job(self, job_id: str) -> Optional[IngestJob]:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT * FROM ingest_jobs WHERE job_id = ?", (job_id,)
            ).fetchone()
            if not row:
                return None
            data = dict(row)
            data["status"] = JobStatus(data["status"])
            if data.get("created_at"):
                data["created_at"] = datetime.fromisoformat(data["created_at"])
            if data.get("completed_at"):
                data["completed_at"] = datetime.fromisoformat(data["completed_at"])
            return IngestJob(**data)

    def list_jobs(self, limit: int = 50) -> List[dict]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT * FROM ingest_jobs ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
            return [dict(r) for r in rows]

    # --- Page hashes (change detection for push ingest) ---

    def get_page_hash(self, domain: str, page_url: str) -> Optional[str]:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT hash FROM page_hashes WHERE domain=? AND page_url=?",
                (domain, page_url)
            ).fetchone()
            return row["hash"] if row else None

    def save_page_hash(self, domain: str, page_url: str, hash_val: str):
        now = datetime.utcnow().isoformat()
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO page_hashes (domain, page_url, hash, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(domain, page_url) DO UPDATE SET
                    hash = excluded.hash,
                    updated_at = excluded.updated_at
            """, (domain, page_url, hash_val, now))
            conn.commit()

    # --- Page snapshots (AI-readable cached pages) ---

    def save_page_snapshot(self, domain: str, page_path: str, page_url: str,
                           title: str, description: str, html_snapshot: str,
                           text_content: str, headings_json: str = "[]"):
        now = datetime.utcnow().isoformat()
        with self._get_conn() as conn:
            conn.execute("""
                INSERT INTO page_snapshots
                    (domain, page_path, page_url, title, description,
                     html_snapshot, text_content, headings_json, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(domain, page_path) DO UPDATE SET
                    page_url = excluded.page_url,
                    title = excluded.title,
                    description = excluded.description,
                    html_snapshot = excluded.html_snapshot,
                    text_content = excluded.text_content,
                    headings_json = excluded.headings_json,
                    updated_at = excluded.updated_at
            """, (domain, page_path, page_url, title, description,
                  html_snapshot, text_content, headings_json, now))
            conn.commit()

    def get_page_snapshot(self, domain: str, page_path: str) -> Optional[dict]:
        with self._get_conn() as conn:
            row = conn.execute(
                "SELECT * FROM page_snapshots WHERE domain=? AND page_path=?",
                (domain, page_path)
            ).fetchone()
            return dict(row) if row else None

    def list_page_snapshots(self, domain: str) -> List[dict]:
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT domain, page_path, page_url, title, description, updated_at "
                "FROM page_snapshots WHERE domain=? ORDER BY page_path",
                (domain,)
            ).fetchall()
            return [dict(r) for r in rows]

    def get_all_snapshots_full(self, domain: str) -> List[dict]:
        """Get all snapshots with full text content for llms-full.txt generation."""
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT page_path, page_url, title, description, text_content, headings_json, updated_at "
                "FROM page_snapshots WHERE domain=? ORDER BY page_path",
                (domain,)
            ).fetchall()
            return [dict(r) for r in rows]

    def list_all_snapshot_domains(self) -> List[str]:
        """List all domains that have page snapshots."""
        with self._get_conn() as conn:
            rows = conn.execute(
                "SELECT DISTINCT domain FROM page_snapshots ORDER BY domain"
            ).fetchall()
            return [r["domain"] for r in rows]
