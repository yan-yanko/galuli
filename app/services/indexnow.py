"""
IndexNow integration — ping Bing when page snapshots are created/updated.

IndexNow is free and reaches Bing, Yandex, Seznam, Naver simultaneously.
ChatGPT uses Bing for web search, so IndexNow submissions directly improve
ChatGPT discoverability of Galuli-hosted page snapshots.

Spec: https://www.indexnow.org/documentation
"""
import hashlib
import logging
from typing import List, Optional

import httpx

logger = logging.getLogger(__name__)

# IndexNow key — deterministic from domain so it's stable across restarts.
# The key file is served at /indexnow-key.txt by main.py.
INDEXNOW_KEY = "galuli-indexnow-2026"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"


async def ping_indexnow(urls: List[str], host: str = "galuli.io"):
    """
    Submit URLs to IndexNow for immediate indexing by Bing + partners.
    Fire-and-forget — failures are logged but don't affect the main flow.
    """
    if not urls:
        return

    try:
        payload = {
            "host": host,
            "key": INDEXNOW_KEY,
            "keyLocation": f"https://{host}/{INDEXNOW_KEY}.txt",
            "urlList": urls[:10000],  # IndexNow limit: 10k URLs per batch
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(INDEXNOW_ENDPOINT, json=payload)
            if resp.status_code in (200, 202):
                logger.info(f"[indexnow] Submitted {len(urls)} URLs to IndexNow")
            else:
                logger.warning(f"[indexnow] IndexNow returned {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        logger.warning(f"[indexnow] Failed to ping IndexNow: {e}")


async def ping_snapshot_urls(domain: str, page_paths: List[str],
                              base_url: str = "https://galuli.io"):
    """
    Ping IndexNow with the Galuli-hosted snapshot URLs for a domain.
    Called after saving page snapshots.
    """
    urls = []
    for path in page_paths:
        # The snapshot URL that AI crawlers will find
        clean_path = path.lstrip("/")
        urls.append(f"{base_url}/registry/{domain}/pages/{clean_path}")

    # Also ping the llms-full.txt URL
    urls.append(f"{base_url}/registry/{domain}/llms-full.txt")

    await ping_indexnow(urls)
