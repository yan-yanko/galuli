"""
Content Doctor routes — AI-powered content optimization for GEO.

Sprint 2: Authority Architect

POST /api/v1/content-doctor/analyze         ← analyze raw content (paste)
POST /api/v1/content-doctor/analyze-url     ← fetch + analyze a URL
GET  /api/v1/content-doctor/{domain}        ← domain-level report (from registry)
"""
import logging
import httpx
import re
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, HttpUrl
from typing import Optional

from app.services.content_doctor import ContentDoctorService

logger = logging.getLogger(__name__)
router = APIRouter()


class AnalyzeContentRequest(BaseModel):
    content: str
    url: Optional[str] = ""


class AnalyzeUrlRequest(BaseModel):
    url: str
    mode: Optional[str] = "full"   # "authority" | "structure" | "full"


def _extract_text_from_html(html: str) -> str:
    """
    Lightweight HTML → text extractor.
    Strips tags, scripts, styles. Returns readable text.
    """
    # Remove script and style blocks
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    # Replace block tags with newlines
    html = re.sub(r"<(br|p|h[1-6]|li|tr|div|section|article)[^>]*>", "\n", html, flags=re.IGNORECASE)
    # Strip remaining tags
    html = re.sub(r"<[^>]+>", "", html)
    # Clean up whitespace
    html = re.sub(r"[ \t]+", " ", html)
    html = re.sub(r"\n{3,}", "\n\n", html)
    # Decode common HTML entities
    for entity, char in [("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"), ("&nbsp;", " "), ("&#39;", "'"), ("&quot;", '"')]:
        html = html.replace(entity, char)
    return html.strip()


@router.post("/analyze", summary="Analyze pasted content for GEO improvements")
async def analyze_content(payload: AnalyzeContentRequest, request: Request):
    """
    Run Content Doctor on raw text/markdown content.

    Runs both Authority Gap Scanner and Structural Optimizer.
    Returns combined content health score + actionable fixes.
    """
    if not payload.content or len(payload.content.strip()) < 100:
        raise HTTPException(status_code=400, detail="Content must be at least 100 characters")

    try:
        doctor = ContentDoctorService()
        result = await doctor.full_diagnosis(payload.content, url=payload.url or "")
        return result
    except Exception as e:
        logger.error(f"Content analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze-url", summary="Fetch and analyze a URL for GEO improvements")
async def analyze_url(payload: AnalyzeUrlRequest, request: Request):
    """
    Fetch a live URL, extract its text content, and run Content Doctor analysis.

    Supports mode: 'authority' | 'structure' | 'full' (default).
    """
    url = payload.url
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # Fetch page
    try:
        async with httpx.AsyncClient(
            timeout=15,
            headers={"User-Agent": "Galuli-ContentDoctor/1.0 (+https://galuli.io/content-doctor)"},
            follow_redirects=True,
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            html = resp.text
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail=f"Timed out fetching {url}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=422, detail=f"Could not fetch URL: HTTP {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not fetch URL: {str(e)}")

    content = _extract_text_from_html(html)
    if len(content.strip()) < 100:
        raise HTTPException(status_code=422, detail="Could not extract enough text from this URL")

    try:
        doctor = ContentDoctorService()
        mode = payload.mode or "full"

        if mode == "authority":
            result = await doctor.analyze_authority_gaps(content, url)
        elif mode == "structure":
            result = await doctor.analyze_structure(content, url)
        else:
            result = await doctor.full_diagnosis(content, url)

        return result
    except Exception as e:
        logger.error(f"Content Doctor URL analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/{domain}", summary="Domain-level Content Doctor report")
async def domain_report(domain: str, request: Request):
    """
    Run Content Doctor analysis across all indexed pages for a domain.

    Pulls page content from the existing Galuli registry (already crawled),
    analyzes up to 5 pages, and returns a domain-level report with:
      - Domain health score (0-100)
      - Per-page authority + structure breakdown
      - Prioritized fix list
    """
    domain = domain.replace("www.", "").lower().strip()

    try:
        doctor = ContentDoctorService()
        result = await doctor.analyze_from_registry(domain)

        if result.get("error") and not result.get("pages"):
            raise HTTPException(status_code=404, detail=result["error"])

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Domain Content Doctor report failed for {domain}: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
