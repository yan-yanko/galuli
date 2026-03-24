"""
Firecrawl-powered crawler.

Uses Firecrawl's /crawl endpoint to:
- Render JS-heavy SPAs (React, Next.js, Vue, etc.)
- Return clean markdown instead of raw HTML
- Handle anti-bot measures and rate limiting
- Discover internal links automatically

Falls back to lightweight httpx+BS4 crawler if Firecrawl key is not configured.
"""
import asyncio
import time
import logging
from urllib.parse import urljoin, urlparse
from typing import List, Optional, Set

import httpx
from bs4 import BeautifulSoup
from firecrawl import FirecrawlApp

from app.models.crawl import CrawlResult, PageContent

logger = logging.getLogger(__name__)

# Pages most likely to contain capability/pricing/API info — used in fallback crawler
PRIORITY_PATH_KEYWORDS = [
    "/pricing", "/price", "/plans",
    "/api", "/docs", "/documentation",
    "/features", "/product", "/solutions",
    "/about", "/enterprise", "/integrations",
    "/status", "/security", "/changelog", "/developer",
]

MAX_PAGES = 20
MAX_CONTENT_BYTES = 50_000
REQUEST_TIMEOUT = 10.0
CONCURRENCY = 4
CRAWLER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"


class CrawlerService:
    """
    Primary: Firecrawl (handles JS rendering, anti-bot, returns clean markdown).
    Fallback: httpx + BeautifulSoup (for when Firecrawl key not set or quota exceeded).
    """

    def __init__(self, use_playwright: bool = False, max_pages: int = None):
        from app.config import settings
        self.max_pages = max_pages or settings.max_pages_per_crawl
        self._firecrawl_key = settings.firecrawl_api_key

    async def crawl(self, url: str) -> CrawlResult:
        if not url.startswith("http"):
            url = f"https://{url}"

        if self._firecrawl_key:
            return await self._crawl_firecrawl(url)
        else:
            logger.warning("FIRECRAWL_API_KEY not set — using fallback crawler (JS sites may yield poor results)")
            return await self._crawl_fallback(url)

    # ── Firecrawl ────────────────────────────────────────────────────────────

    async def _crawl_firecrawl(self, url: str) -> CrawlResult:
        """
        Use Firecrawl's crawl endpoint.
        Runs synchronous SDK in executor to avoid blocking the event loop.
        """
        start = time.time()
        parsed = urlparse(url)
        domain = parsed.netloc.replace("www.", "")

        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                None,
                lambda: self._firecrawl_crawl_sync(url)
            )
            pages = result["pages"]
            duration_ms = int((time.time() - start) * 1000)
            logger.info(f"[Firecrawl] {domain}: {len(pages)} pages in {duration_ms}ms")
            return CrawlResult(
                domain=domain,
                seed_url=url,
                pages=pages,
                total_pages=len(pages),
                crawl_duration_ms=duration_ms,
                used_playwright=True,
            )
        except Exception as e:
            logger.warning(f"[Firecrawl] Failed for {domain}: {e} — falling back to httpx")
            return await self._crawl_fallback(url)

    def _firecrawl_crawl_sync(self, url: str) -> dict:
        """Synchronous Firecrawl call — run in executor.

        Strategy: use scrape (single-page, instant) for the seed URL,
        then use map+batch-scrape for up to max_pages-1 additional pages.
        This is 3-5x faster than crawl_url which does recursive discovery.
        """
        fc = FirecrawlApp(api_key=self._firecrawl_key)
        scrape_opts = {
            "formats": ["markdown"],
            "onlyMainContent": True,
            "excludeTags": ["nav", "footer", "header", "aside", "script", "style"],
        }

        pages = []

        # Step 1: Scrape seed URL instantly (no polling, ~2-3s)
        try:
            seed = fc.scrape_url(url, params=scrape_opts)
            seed_content = (
                seed.get("markdown", "") if isinstance(seed, dict)
                else getattr(seed, "markdown", "") or ""
            )
            seed_meta = (
                seed.get("metadata", {}) if isinstance(seed, dict)
                else getattr(seed, "metadata", {}) or {}
            )
            seed_url_out = (
                seed_meta.get("url", url) if isinstance(seed_meta, dict)
                else getattr(seed_meta, "url", url) or url
            )
            seed_title = (
                seed_meta.get("title", "") if isinstance(seed_meta, dict)
                else getattr(seed_meta, "title", "") or ""
            )
            if seed_content:
                pages.append(PageContent(
                    url=seed_url_out,
                    title=seed_title or None,
                    text=seed_content[:MAX_CONTENT_BYTES],
                    html=None,
                    status_code=200,
                ))
        except Exception as e:
            logger.warning(f"[Firecrawl] scrape seed failed: {e}")

        # Step 2: Map domain to get internal links (fast, no content fetching)
        remaining = self.max_pages - len(pages)
        if remaining > 0:
            try:
                map_result = fc.map_url(url, params={"limit": remaining * 3})
                links = []
                if isinstance(map_result, dict):
                    links = map_result.get("links", []) or []
                elif hasattr(map_result, "links"):
                    links = map_result.links or []

                # Filter to priority paths and exclude seed
                priority_kw = ["/pricing", "/price", "/plans", "/docs", "/api",
                               "/features", "/about", "/product", "/integrations"]
                priority = [l for l in links if any(kw in l.lower() for kw in priority_kw) and l != url]
                others = [l for l in links if l not in priority and l != url]
                ordered = (priority + others)[:remaining]

                if ordered:
                    batch = fc.batch_scrape_urls(ordered, params=scrape_opts)
                    batch_data = []
                    if isinstance(batch, dict):
                        batch_data = batch.get("data", []) or []
                    elif hasattr(batch, "data"):
                        batch_data = batch.data or []

                    for item in batch_data:
                        if isinstance(item, dict):
                            meta = item.get("metadata", {})
                            content = item.get("markdown", "") or ""
                            page_url = meta.get("url", "") or item.get("url", "")
                            title = meta.get("title", "")
                        else:
                            meta = getattr(item, "metadata", {}) or {}
                            content = getattr(item, "markdown", "") or ""
                            page_url = (meta.get("url") if isinstance(meta, dict) else getattr(meta, "url", "")) or ""
                            title = (meta.get("title") if isinstance(meta, dict) else getattr(meta, "title", "")) or ""
                        if content and page_url:
                            pages.append(PageContent(
                                url=page_url,
                                title=title or None,
                                text=content[:MAX_CONTENT_BYTES],
                                html=None,
                                status_code=200,
                            ))
            except Exception as e:
                logger.warning(f"[Firecrawl] map/batch failed: {e} — using pages from seed only")

        return {"pages": pages}

    # ── Fallback: httpx + BS4 ────────────────────────────────────────────────

    async def _crawl_fallback(self, url: str) -> CrawlResult:
        start = time.time()
        parsed = urlparse(url)
        domain = parsed.netloc.replace("www.", "")
        base_url = f"{parsed.scheme}://{parsed.netloc}"

        visited: Set[str] = set()
        pages: List[PageContent] = []

        async with httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True,
            headers={"User-Agent": CRAWLER_UA},
        ) as client:
            homepage = await self._fetch_page(client, url)
            if homepage:
                pages.append(homepage)
                visited.add(self._normalize_url(url))

                all_links = self._extract_links(homepage.html or "", base_url, domain)
                priority_links = self._prioritize_links(all_links, visited)

                sem = asyncio.Semaphore(CONCURRENCY)
                batch = priority_links[: self.max_pages - 1]
                tasks = [self._bounded_fetch(client, link, sem) for link in batch]
                results = await asyncio.gather(*tasks, return_exceptions=True)

                for link, result in zip(batch, results):
                    if isinstance(result, PageContent):
                        pages.append(result)
                        visited.add(self._normalize_url(link))

        duration_ms = int((time.time() - start) * 1000)
        logger.info(f"[Fallback] {domain}: {len(pages)} pages in {duration_ms}ms")

        return CrawlResult(
            domain=domain,
            seed_url=url,
            pages=pages,
            total_pages=len(pages),
            crawl_duration_ms=duration_ms,
            used_playwright=False,
        )

    async def _bounded_fetch(self, client, url, sem):
        async with sem:
            await asyncio.sleep(0.3)
            return await self._fetch_page(client, url)

    async def _fetch_page(self, client, url: str) -> Optional[PageContent]:
        try:
            resp = await client.get(url)
            if resp.status_code >= 400:
                return None
            content_type = resp.headers.get("content-type", "")
            if "text/html" not in content_type and "application/xhtml" not in content_type:
                return None

            html = resp.text
            soup = BeautifulSoup(html, "lxml")
            for tag in soup(["script", "style", "nav", "footer", "header",
                             "aside", "noscript", "iframe", "svg", "form"]):
                tag.decompose()

            text = soup.get_text(separator="\n", strip=True)
            text = "\n".join(line for line in text.splitlines() if line.strip())
            text = text[:MAX_CONTENT_BYTES]

            title_tag = soup.find("title")
            title = title_tag.get_text(strip=True) if title_tag else None

            return PageContent(
                url=url, title=title, text=text,
                html=html[:MAX_CONTENT_BYTES], status_code=resp.status_code,
            )
        except Exception as e:
            logger.warning(f"Failed to fetch {url}: {e}")
            return None

    def _extract_links(self, html: str, base_url: str, domain: str) -> List[str]:
        soup = BeautifulSoup(html, "lxml")
        links = []
        seen = set()
        for a in soup.find_all("a", href=True):
            href = str(a["href"]).strip()
            if not href or href.startswith("#") or href.startswith("mailto:"):
                continue
            full_url = urljoin(base_url, href)
            parsed = urlparse(full_url)
            if domain not in parsed.netloc:
                continue
            path = parsed.path.lower()
            if any(path.endswith(ext) for ext in [
                ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".svg",
                ".zip", ".tar", ".gz", ".xml", ".json", ".css", ".js"
            ]):
                continue
            clean = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
            if clean not in seen:
                seen.add(clean)
                links.append(clean)
        return links

    def _prioritize_links(self, links: List[str], visited: Set[str]) -> List[str]:
        def score(url: str) -> int:
            path = urlparse(url).path.lower()
            for i, keyword in enumerate(PRIORITY_PATH_KEYWORDS):
                if keyword in path:
                    return len(PRIORITY_PATH_KEYWORDS) - i
            return 0
        unvisited = [l for l in links if self._normalize_url(l) not in visited]
        return sorted(unvisited, key=score, reverse=True)

    def _normalize_url(self, url: str) -> str:
        return url.rstrip("/").lower()
