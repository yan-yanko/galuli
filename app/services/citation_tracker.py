"""
Citation Tracker — tracks whether AI engines cite a user's domain
when asked relevant questions.

Tables:
  citation_queries  — keywords/questions the user wants to track per domain
  citation_results  — one row per (run, query, engine) with cited/snippet

Engines:
  perplexity  — sonar model, live web search (needs PERPLEXITY_API_KEY)
  openai      — gpt-4o-search-preview, live web (needs OPENAI_API_KEY, graceful fallback)
  claude      — training-knowledge only (Anthropic API already configured)
"""

import asyncio
import logging
import pathlib
import re
import sqlite3
import uuid
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

# Deterministic question templates — same keyword always → same question → comparable trends
QUESTION_TEMPLATES = [
    "What is the best tool for {keyword}?",
    "Which platforms help with {keyword}?",
    "What do experts recommend for {keyword}?",
    "How can I improve my {keyword}?",
    "What are the top solutions for {keyword}?",
]

ENGINES = ("perplexity", "openai", "claude")


class CitationService:
    def __init__(self, db_path: Optional[str] = None):
        from app.config import settings
        self._settings = settings
        if db_path is None:
            root = pathlib.Path(__file__).resolve().parent.parent.parent
            db_path = str(root / "data" / "citations.db")
        self._db_path = db_path
        pathlib.Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    # ── DB init ───────────────────────────────────────────────────────────────

    def _init_db(self):
        with self._conn() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS citation_queries (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    api_key     TEXT NOT NULL,
                    domain      TEXT NOT NULL,
                    type        TEXT NOT NULL DEFAULT 'keyword',
                    value       TEXT NOT NULL,
                    created_at  TEXT NOT NULL,
                    UNIQUE(api_key, domain, value)
                );
                CREATE INDEX IF NOT EXISTS idx_cq_key_domain
                    ON citation_queries(api_key, domain);

                CREATE TABLE IF NOT EXISTS citation_results (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    api_key       TEXT NOT NULL,
                    domain        TEXT NOT NULL,
                    query_id      INTEGER NOT NULL,
                    question      TEXT NOT NULL,
                    engine        TEXT NOT NULL,
                    cited         INTEGER NOT NULL DEFAULT 0,
                    snippet       TEXT,
                    full_response TEXT,
                    checked_at    TEXT NOT NULL,
                    run_id        TEXT NOT NULL,
                    engine_model  TEXT,
                    error         TEXT,
                    status        TEXT DEFAULT 'complete'
                );
                CREATE INDEX IF NOT EXISTS idx_cr_key_domain
                    ON citation_results(api_key, domain);
                CREATE INDEX IF NOT EXISTS idx_cr_checked_at
                    ON citation_results(checked_at);
                CREATE INDEX IF NOT EXISTS idx_cr_run_id
                    ON citation_results(run_id);
            """)

    def _conn(self):
        conn = sqlite3.connect(self._db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        return conn

    # ── Query management ──────────────────────────────────────────────────────

    def add_query(self, api_key: str, domain: str, type_: str, value: str) -> Optional[dict]:
        """Add a keyword or question to track. Returns new row or None if duplicate."""
        now = datetime.utcnow().isoformat()
        try:
            with self._conn() as conn:
                conn.execute(
                    "INSERT OR IGNORE INTO citation_queries (api_key, domain, type, value, created_at) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (api_key, domain, type_, value.strip(), now),
                )
                conn.commit()
                row = conn.execute(
                    "SELECT * FROM citation_queries WHERE api_key=? AND domain=? AND value=?",
                    (api_key, domain, value.strip()),
                ).fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"add_query error: {e}")
            return None

    def remove_query(self, api_key: str, query_id: int) -> bool:
        try:
            with self._conn() as conn:
                conn.execute(
                    "DELETE FROM citation_queries WHERE id=? AND api_key=?",
                    (query_id, api_key),
                )
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"remove_query error: {e}")
            return False

    def list_queries(self, api_key: str, domain: str) -> list[dict]:
        try:
            with self._conn() as conn:
                rows = conn.execute(
                    "SELECT * FROM citation_queries WHERE api_key=? AND domain=? ORDER BY id",
                    (api_key, domain),
                ).fetchall()
                return [dict(r) for r in rows]
        except Exception:
            return []

    def count_queries(self, api_key: str, domain: str) -> int:
        try:
            with self._conn() as conn:
                return conn.execute(
                    "SELECT COUNT(*) FROM citation_queries WHERE api_key=? AND domain=?",
                    (api_key, domain),
                ).fetchone()[0]
        except Exception:
            return 0

    # ── Results persistence ───────────────────────────────────────────────────

    def _save_result(self, r: dict):
        try:
            with self._conn() as conn:
                conn.execute(
                    "INSERT INTO citation_results "
                    "(api_key, domain, query_id, question, engine, cited, snippet, full_response, "
                    " checked_at, run_id, engine_model, error, status) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        r.get("api_key"), r.get("domain"), r.get("query_id"),
                        r.get("question"), r.get("engine"), 1 if r.get("cited") else 0,
                        r.get("snippet"), r.get("full_response"),
                        r.get("checked_at", datetime.utcnow().isoformat()),
                        r.get("run_id"), r.get("engine_model"), r.get("error"),
                        r.get("status", "complete"),
                    ),
                )
                conn.commit()
        except Exception as e:
            logger.error(f"_save_result error: {e}")

    # ── Query results ─────────────────────────────────────────────────────────

    def get_latest_results(self, api_key: str, domain: str) -> dict:
        """
        Returns structured results: for each query, the latest result per engine.
        Shape: { domain, last_checked, queries: [...] }
        """
        queries = self.list_queries(api_key, domain)
        if not queries:
            return {"domain": domain, "last_checked": None, "queries": []}

        try:
            with self._conn() as conn:
                # Get latest result per (query_id, engine)
                rows = conn.execute(
                    """
                    SELECT cr.*
                    FROM citation_results cr
                    INNER JOIN (
                        SELECT query_id, engine, MAX(checked_at) AS max_checked
                        FROM citation_results
                        WHERE api_key=? AND domain=?
                        GROUP BY query_id, engine
                    ) latest ON cr.query_id = latest.query_id
                               AND cr.engine = latest.engine
                               AND cr.checked_at = latest.max_checked
                    WHERE cr.api_key=? AND cr.domain=?
                    """,
                    (api_key, domain, api_key, domain),
                ).fetchall()
        except Exception:
            rows = []

        # Index by query_id → engine
        results_by_query: dict = {}
        last_checked = None
        for row in rows:
            r = dict(row)
            qid = r["query_id"]
            eng = r["engine"]
            if qid not in results_by_query:
                results_by_query[qid] = {}
            results_by_query[qid][eng] = {
                "cited": bool(r["cited"]),
                "snippet": r["snippet"],
                "engine_model": r["engine_model"],
                "error": r["error"],
                "checked_at": r["checked_at"],
            }
            if last_checked is None or r["checked_at"] > last_checked:
                last_checked = r["checked_at"]

        # Build response
        out_queries = []
        for q in queries:
            qid = q["id"]
            generated = (
                q["value"] if q["type"] == "question"
                else self._generate_question(q["value"])
            )
            out_queries.append({
                "id": qid,
                "type": q["type"],
                "value": q["value"],
                "generated_question": generated,
                "engines": results_by_query.get(qid, {}),
            })

        return {
            "domain": domain,
            "last_checked": last_checked,
            "queries": out_queries,
        }

    def get_trend(self, api_key: str, domain: str, weeks: int = 4) -> dict:
        """Weekly citation counts for the sparkline chart."""
        since = (datetime.utcnow() - timedelta(weeks=weeks)).isoformat()
        try:
            with self._conn() as conn:
                rows = conn.execute(
                    """
                    SELECT
                        -- ISO week start (Monday) via date arithmetic
                        date(checked_at, 'weekday 1', '-7 days') AS week_start,
                        SUM(cited)  AS citations,
                        COUNT(*)    AS total_checks
                    FROM citation_results
                    WHERE api_key=? AND domain=? AND checked_at >= ?
                    GROUP BY week_start
                    ORDER BY week_start
                    """,
                    (api_key, domain, since),
                ).fetchall()
        except Exception:
            rows = []

        week_data = [
            {
                "week": r["week_start"],
                "citations": int(r["citations"] or 0),
                "total_checks": int(r["total_checks"] or 0),
            }
            for r in rows
        ]

        # Trend: compare last 2 weeks
        trend = "insufficient_data"
        if len(week_data) >= 2:
            last = week_data[-1]["citations"]
            prev = week_data[-2]["citations"]
            if last > prev:
                trend = "up"
            elif last < prev:
                trend = "down"
            else:
                trend = "same"

        return {"domain": domain, "weeks": week_data, "trend": trend}

    def get_run_history(self, api_key: str, domain: str, limit: int = 10) -> list[dict]:
        """Summary of past check runs — one entry per run_id."""
        try:
            with self._conn() as conn:
                rows = conn.execute(
                    """
                    SELECT
                        run_id,
                        MIN(checked_at) AS started_at,
                        MAX(checked_at) AS finished_at,
                        COUNT(DISTINCT query_id) AS questions,
                        COUNT(DISTINCT engine) AS engines,
                        SUM(cited) AS total_cited,
                        COUNT(*) AS total_checks
                    FROM citation_results
                    WHERE api_key=? AND domain=?
                    GROUP BY run_id
                    ORDER BY started_at DESC
                    LIMIT ?
                    """,
                    (api_key, domain, limit),
                ).fetchall()
                return [dict(r) for r in rows]
        except Exception:
            return []

    # ── Question generation ───────────────────────────────────────────────────

    def _generate_question(self, keyword: str) -> str:
        """Deterministic template selection — same keyword → same question every run."""
        idx = sum(ord(c) for c in keyword) % len(QUESTION_TEMPLATES)
        return QUESTION_TEMPLATES[idx].format(keyword=keyword)

    # ── Citation detection ────────────────────────────────────────────────────

    # Phrases that indicate the domain is mentioned as NOT known/cited — false positive patterns
    NEGATION_PATTERNS = [
        r"don't have (?:specific )?information about",
        r"no (?:specific )?information about",
        r"not (?:familiar|aware) with",
        r"doesn't appear to be",
        r"does not appear to be",
        r"isn't (?:a )?(?:well-known|notable|recognized|listed)",
        r"is not (?:a )?(?:well-known|notable|recognized|listed)",
        r"not (?:a )?(?:well-known|notable|recognized)",
        r"cannot (?:find|verify|confirm)",
        r"can't (?:find|verify|confirm)",
        r"not in my (?:training|knowledge)",
        r"outside (?:my|the scope of my) (?:training|knowledge)",
        r"i don't (?:have|know)",
        r"i do not (?:have|know)",
    ]

    def _detect_citation(self, response_text: str, domain: str) -> tuple[bool, Optional[str]]:
        """
        Check if domain appears in response as a positive citation. Returns (cited, snippet).
        - Checks bare domain, www variant, and name-only (if >5 chars)
        - Excludes matches where the domain appears in a negation/denial context
        """
        domain_lower = domain.lower().replace("www.", "")
        name_only = domain_lower.rsplit(".", 1)[0]  # 'galuli' from 'galuli.io'

        patterns = [re.escape(domain_lower), re.escape(f"www.{domain_lower}")]
        if len(name_only) > 5:
            patterns.append(re.escape(name_only))

        text_lower = response_text.lower()
        for pattern in patterns:
            m = re.search(pattern, text_lower)
            if m:
                # Extract surrounding context (±200 chars) for negation check
                start = max(0, m.start() - 200)
                end = min(len(response_text), m.end() + 200)
                context = text_lower[start:end]

                # Check if the mention is in a negation/denial context
                is_negation = any(
                    re.search(neg, context)
                    for neg in self.NEGATION_PATTERNS
                )
                if is_negation:
                    return False, None

                # Genuine citation — extract tighter snippet (±150 chars)
                snip_start = max(0, m.start() - 150)
                snip_end = min(len(response_text), m.end() + 150)
                snippet = response_text[snip_start:snip_end].strip()
                return True, snippet

        return False, None

    # ── Engine callers ────────────────────────────────────────────────────────

    async def _query_perplexity(self, question: str, domain: str) -> dict:
        if not self._settings.perplexity_api_key:
            return {
                "engine": "perplexity", "engine_model": None,
                "cited": False, "snippet": None, "full_response": None,
                "error": "PERPLEXITY_API_KEY not configured",
            }
        try:
            import httpx
            payload = {
                "model": "sonar",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful assistant. Answer concisely. "
                            "Include URLs of relevant sources where appropriate."
                        ),
                    },
                    {"role": "user", "content": question},
                ],
                "max_tokens": 600,
            }
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    "https://api.perplexity.ai/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self._settings.perplexity_api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
            cited, snippet = self._detect_citation(text, domain)
            return {
                "engine": "perplexity", "engine_model": "sonar",
                "cited": cited, "snippet": snippet,
                "full_response": text[:2000], "error": None,
            }
        except Exception as e:
            logger.warning(f"Perplexity query failed: {e}")
            return {
                "engine": "perplexity", "engine_model": "sonar",
                "cited": False, "snippet": None, "full_response": None,
                "error": str(e),
            }

    async def _query_openai(self, question: str, domain: str) -> dict:
        if not self._settings.openai_api_key:
            return {
                "engine": "openai", "engine_model": None,
                "cited": False, "snippet": None, "full_response": None,
                "error": "OPENAI_API_KEY not configured",
            }
        try:
            import httpx
            payload = {
                "model": "gpt-4o-search-preview",
                "messages": [{"role": "user", "content": question}],
                "max_tokens": 600,
            }
            async with httpx.AsyncClient(timeout=45) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self._settings.openai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                if resp.status_code == 404:
                    return {
                        "engine": "openai", "engine_model": "gpt-4o-search-preview",
                        "cited": False, "snippet": None, "full_response": None,
                        "error": "gpt-4o-search-preview not available on this account",
                    }
                resp.raise_for_status()
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
            cited, snippet = self._detect_citation(text, domain)
            return {
                "engine": "openai", "engine_model": "gpt-4o-search-preview",
                "cited": cited, "snippet": snippet,
                "full_response": text[:2000], "error": None,
            }
        except Exception as e:
            logger.warning(f"OpenAI query failed: {e}")
            return {
                "engine": "openai", "engine_model": "gpt-4o-search-preview",
                "cited": False, "snippet": None, "full_response": None,
                "error": str(e),
            }

    async def _query_claude(self, question: str, domain: str) -> dict:
        """
        Uses Claude's training knowledge — NOT live web.
        Asks the question naturally without prompting Claude to mention the domain.
        Results are labeled 'claude' in DB; UI shows 'Claude (training)'.
        """
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self._settings.anthropic_api_key)
            msg = client.messages.create(
                model=self._settings.fast_model,
                max_tokens=600,
                messages=[{"role": "user", "content": question}],
            )
            text = msg.content[0].text
            cited, snippet = self._detect_citation(text, domain)
            return {
                "engine": "claude", "engine_model": self._settings.fast_model,
                "cited": cited, "snippet": snippet,
                "full_response": text[:2000], "error": None,
            }
        except Exception as e:
            logger.warning(f"Claude query failed: {e}")
            return {
                "engine": "claude", "engine_model": self._settings.fast_model,
                "cited": False, "snippet": None, "full_response": None,
                "error": str(e),
            }

    def _get_enabled_engines(self):
        """Return list of engine callables that have API keys configured."""
        engines = [self._query_claude]  # Always available (uses existing Anthropic key)
        if self._settings.perplexity_api_key:
            engines.insert(0, self._query_perplexity)  # Perplexity first (best signal)
        if self._settings.openai_api_key:
            engines.append(self._query_openai)
        return engines

    # ── Main orchestrator ─────────────────────────────────────────────────────

    async def run_check(self, api_key: str, domain: str) -> dict:
        """
        Run a full citation check for all tracked queries on a domain.
        Queries all enabled engines concurrently per question.
        Returns a summary dict.
        """
        queries = self.list_queries(api_key, domain)
        if not queries:
            return {"run_id": None, "domain": domain, "error": "No queries configured"}

        run_id = uuid.uuid4().hex[:12]
        engines = self._get_enabled_engines()
        checked = 0

        for q in queries[:self._settings.citation_max_queries]:
            question = (
                q["value"] if q["type"] == "question"
                else self._generate_question(q["value"])
            )

            # Run all engines concurrently for this question
            engine_results = await asyncio.gather(
                *[engine(question, domain) for engine in engines],
                return_exceptions=True,
            )

            for result in engine_results:
                if isinstance(result, Exception):
                    result = {
                        "engine": "unknown", "engine_model": None,
                        "cited": False, "snippet": None, "full_response": None,
                        "error": str(result),
                    }
                self._save_result({
                    **result,
                    "api_key": api_key,
                    "domain": domain,
                    "query_id": q["id"],
                    "question": question,
                    "run_id": run_id,
                    "checked_at": datetime.utcnow().isoformat(),
                    "status": "complete",
                })
            checked += 1

        logger.info(f"Citation check complete: {domain}, run={run_id}, questions={checked}, engines={len(engines)}")
        return {
            "run_id": run_id,
            "domain": domain,
            "questions_checked": checked,
            "engines": [e.__name__.replace("_query_", "") for e in engines],
            "checked_at": datetime.utcnow().isoformat(),
        }
