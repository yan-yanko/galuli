"""
Analytics routes.

POST /api/v1/analytics/event              ← AI agent hit events from snippet
GET  /api/v1/analytics/{domain}           ← customer dashboard data
GET  /api/v1/analytics/{domain}/agents    ← agent breakdown
GET  /api/v1/analytics/{domain}/pages     ← per-page breakdown

Sprint 1 — AI Analytics ROI Engine:
GET  /api/v1/analytics/{domain}/topics        ← topic-level AI attention map
GET  /api/v1/analytics/{domain}/attention     ← AI Attention Score (0-100)
GET  /api/v1/analytics/{domain}/llm-depth     ← per-LLM crawl depth analysis
GET  /api/v1/analytics/{domain}/agent-trend   ← daily trend for a specific agent
"""
import logging
from fastapi import APIRouter, Request, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.api.limiter import limiter
from app.services.analytics import AnalyticsService

logger = logging.getLogger(__name__)
router = APIRouter()
analytics = AnalyticsService()


class AgentEventPayload(BaseModel):
    domain: str
    page_url: str
    agent_name: str          # e.g. "GPTBot", "ClaudeBot", "PerplexityBot"
    agent_type: str          # e.g. "crawler", "llm", "agent", "unknown"
    user_agent: str
    referrer: Optional[str] = None
    ts: Optional[str] = None


@router.post("/event", summary="Log an AI agent hit event")
@limiter.limit("60/minute")
async def log_event(request: Request, payload: AgentEventPayload):
    """Called by the galui.js snippet when an AI agent is detected."""
    analytics.record_event(
        domain=payload.domain,
        page_url=payload.page_url,
        agent_name=payload.agent_name,
        agent_type=payload.agent_type,
        user_agent=payload.user_agent,
        referrer=payload.referrer,
        ts=payload.ts or datetime.utcnow().isoformat(),
    )
    return {"ok": True}


@router.get("/{domain}", summary="Analytics summary for a domain")
async def get_analytics(domain: str, days: int = 30):
    """Full analytics summary: agent hits, top pages, trends."""
    domain = domain.replace("www.", "").lower().strip()
    data = analytics.get_summary(domain, days=days)
    if not data:
        raise HTTPException(status_code=404, detail=f"No analytics for '{domain}'")
    return data


@router.get("/{domain}/agents", summary="Agent breakdown for a domain")
async def get_agents(domain: str, days: int = 30):
    """Which AI agents are hitting this domain and how often."""
    domain = domain.replace("www.", "").lower().strip()
    return analytics.get_agent_breakdown(domain, days=days)


@router.get("/{domain}/pages", summary="Per-page AI traffic breakdown")
async def get_pages(domain: str, days: int = 30):
    """Which pages get the most AI agent traffic."""
    domain = domain.replace("www.", "").lower().strip()
    return analytics.get_page_breakdown(domain, days=days)


# ── Sprint 1: AI Analytics ROI Engine ─────────────────────────────────────────

@router.get("/{domain}/topics", summary="AI Attention by content topic")
async def get_topics(domain: str, days: int = 30):
    """
    Topic-level AI attention map.

    Maps page URLs to content categories (Blog, Product, Pricing, Docs, etc.)
    and shows which topics get the most AI crawler attention — and from which AI systems.
    """
    domain = domain.replace("www.", "").lower().strip()
    return analytics.get_topic_map(domain, days=days)


@router.get("/{domain}/attention", summary="AI Attention Score (0-100)")
async def get_attention_score(domain: str, days: int = 30):
    """
    AI Attention Score — composite 0-100 metric.

    Components:
      - Frequency (40%): how often AI agents visit
      - Depth (35%):     how many unique pages they crawl
      - Recency (25%):   how recently they last visited
      - Diversity bonus: how many distinct AI systems

    Benchmarks: 500 hits/30d, 20+ unique pages = score 100.
    """
    domain = domain.replace("www.", "").lower().strip()
    return analytics.get_ai_attention_score(domain, days=days)


@router.get("/{domain}/llm-depth", summary="Per-LLM crawl depth analysis")
async def get_llm_depth(domain: str, days: int = 30):
    """
    Per-LLM crawl depth and trend.

    For each AI agent: total hits, unique pages, depth ratio,
    first/last seen, and whether attention is growing or declining.
    """
    domain = domain.replace("www.", "").lower().strip()
    return analytics.get_per_llm_depth(domain, days=days)


@router.get("/{domain}/agent-trend", summary="Daily trend for a specific AI agent")
async def get_agent_trend(
    domain: str,
    agent: str = Query(..., description="Agent name, e.g. GPTBot"),
    days: int = 30,
):
    """Daily hit trend for a specific AI agent — used for sparkline charts."""
    domain = domain.replace("www.", "").lower().strip()
    return analytics.get_agent_trend(domain, agent_name=agent, days=days)
