import os
import pathlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# pathlib resolves path correctly on Windows even with non-ASCII parent dirs
_root = pathlib.Path(__file__).parent.parent.parent
load_dotenv(dotenv_path=_root / ".env", override=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.config import settings
    from app.services.storage import StorageService
    from app.services.tenant import TenantService
    from app.services.analytics import AnalyticsService
    from app.services.scheduler import start_scheduler, stop_scheduler

    logger.info("=" * 55)
    logger.info("  Galuli — AI Readability Engine")
    logger.info("=" * 55)
    logger.info(f"  Anthropic:    {'OK' if settings.anthropic_api_key else 'MISSING'}")
    logger.info(f"  Auth:         {'master key' if settings.registry_api_key else 'open (dev)'}")
    logger.info(f"  Database:     {settings.database_url}")
    logger.info(f"  Base URL:     {settings.base_api_url}")
    logger.info(f"  Fast model:   {settings.fast_model}")
    logger.info(f"  Deep model:   {settings.deep_model}")
    logger.info(f"  Perplexity:   {'OK' if settings.perplexity_api_key else 'not configured'}")
    logger.info(f"  OpenAI:       {'OK' if settings.openai_api_key else 'not configured'}")
    logger.info("=" * 55)

    # Init all storage tables
    StorageService()
    TenantService()
    AnalyticsService()
    from app.services.citation_tracker import CitationService
    CitationService()  # creates citation_queries + citation_results tables

    # Start auto-refresh scheduler
    start_scheduler()

    yield

    stop_scheduler()
    logger.info("Galuli shut down")


app = FastAPI(
    title="Galuli — AI Readability Engine",
    description=(
        "Drop one script tag. Your site becomes AI-readable.\n\n"
        "Galuli automatically translates any website into structured, "
        "machine-readable formats for LLMs and AI agents — with WebMCP "
        "auto-registration, llms.txt generation, AI traffic analytics, "
        "and an AI Readiness Score.\n\n"
        "### Output formats\n"
        "- `GET /registry/{domain}` — Full JSON capability registry\n"
        "- `GET /registry/{domain}/llms.txt` — llms.txt standard\n"
        "- `GET /registry/{domain}/ai-plugin.json` — OpenAI plugin manifest\n"
        "- `GET /registry/{domain}/status` — Live liveness check\n\n"
        "### Snippet endpoints\n"
        "- `POST /api/v1/ingest/push` — Receive page data from galuli.js\n"
        "- `GET  /api/v1/score/{domain}` — AI Readiness Score\n"
        "- `GET  /api/v1/score/{domain}/badge` — Embeddable SVG badge\n\n"
        "### Analytics\n"
        "- `GET /api/v1/analytics/{domain}` — AI agent traffic summary\n"
        "- `GET /api/v1/analytics/{domain}/agents` — Agent breakdown\n"
        "- `GET /api/v1/analytics/{domain}/pages` — Per-page breakdown\n"
    ),
    version="3.3.0",
    lifespan=lifespan,
)

from app.api.auth import APIKeyMiddleware
from app.api.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
app.add_middleware(APIKeyMiddleware)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    # "*" is required because galuli.js runs on customer sites (any domain) and
    # needs to POST analytics events + push data. Credentials are NOT allowed with "*".
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key", "X-Galuli-Key"],
)

from app.api.routes import ingest, registry, admin, tenants, push, analytics, billing, content_doctor, score, citations, entity

app.include_router(ingest.router,         prefix="/api/v1",                  tags=["Ingestion"])
app.include_router(push.router,           prefix="/api/v1",                  tags=["Snippet / Push"])
app.include_router(score.router,          prefix="/api/v1/score",            tags=["Score & Badge"])
app.include_router(entity.router,         prefix="/api/v1/entity",           tags=["Entity Check"])
app.include_router(registry.router,       prefix="/registry",                tags=["Registry"])
app.include_router(admin.router,          prefix="/api/v1/admin",            tags=["Admin"])
app.include_router(tenants.router,        prefix="/api/v1/tenants",          tags=["Tenants"])
app.include_router(analytics.router,      prefix="/api/v1/analytics",        tags=["Analytics"])
app.include_router(billing.router,        prefix="/api/v1",                  tags=["Auth & Billing"])
app.include_router(content_doctor.router, prefix="/api/v1/content-doctor",   tags=["Content Doctor"])
app.include_router(citations.router,      prefix="/api/v1/citations",        tags=["Citation Tracker"])


@app.get("/health", tags=["System"])
async def health():
    from app.config import settings
    from app.services.storage import StorageService
    from app.services.analytics import AnalyticsService

    registries = StorageService().list_registries()
    analytics_summary = AnalyticsService().get_all_domains_summary()
    anthropic_ok = bool(os.environ.get("ANTHROPIC_API_KEY") or settings.anthropic_api_key)

    return {
        "status": "ok",
        "service": "galuli",
        "version": "3.3.0",
        "anthropic_configured": anthropic_ok,
        "auth_enabled": bool(settings.registry_api_key),
        "registries_indexed": len(registries),
        "domains_with_ai_traffic": len(analytics_summary),
        "database": settings.database_url,
    }


# ── Crawler-critical public files ──────────────────────────────────────────
# These MUST be served publicly with no auth. AI crawlers and search engines
# check these before doing anything else. A 401 here breaks all discovery.
from fastapi.responses import FileResponse, HTMLResponse, PlainTextResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import pathlib as _pathlib

@app.get("/robots.txt", include_in_schema=False)
async def robots_txt():
    """robots.txt — public, no auth. Directs all crawlers including AI agents."""
    content = (
        "User-agent: *\n"
        "Allow: /\n"
        "\n"
        "# AI training crawlers — allow all\n"
        "User-agent: GPTBot\n"
        "Allow: /\n"
        "\n"
        "User-agent: ChatGPT-User\n"
        "Allow: /\n"
        "\n"
        "User-agent: ClaudeBot\n"
        "Allow: /\n"
        "\n"
        "User-agent: anthropic-ai\n"
        "Allow: /\n"
        "\n"
        "User-agent: PerplexityBot\n"
        "Allow: /\n"
        "\n"
        "User-agent: Google-Extended\n"
        "Allow: /\n"
        "\n"
        "User-agent: Amazonbot\n"
        "Allow: /\n"
        "\n"
        "User-agent: meta-externalagent\n"
        "Allow: /\n"
        "\n"
        "Sitemap: https://galuli.io/sitemap.xml\n"
        "# AI discovery: https://galuli.io/llms.txt\n"
    )
    return PlainTextResponse(content, headers={"Cache-Control": "public, max-age=3600"})


@app.get("/sitemap.xml", include_in_schema=False)
async def sitemap_xml():
    """XML sitemap — public, for search engines and AI crawlers."""
    content = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        '  <url><loc>https://galuli.io/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n'
        '  <url><loc>https://galuli.io/blog</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>\n'
        '  <url><loc>https://galuli.io/install</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/webmcp-explained</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/how-to-get-ai-citations</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/ai-readiness-tech-stack-2026</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/what-is-geo</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/llms-txt-guide</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/ai-readiness-score</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/ai-agent-analytics</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/future-of-search</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/ai-attention-score</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/content-doctor</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/robots-txt-ai-crawlers</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/blog/information-gain-geo</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n'
        '  <url><loc>https://galuli.io/pricing</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>\n'
        '  <url><loc>https://galuli.io/about</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n'
        '  <url><loc>https://galuli.io/roadmap</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>\n'
        '</urlset>\n'
    )
    return HTMLResponse(content, media_type="application/xml",
                        headers={"Cache-Control": "public, max-age=3600"})


@app.get("/llms.txt", include_in_schema=False)
async def llms_txt():
    """
    llms.txt — AI-readable summary of Galuli for language models.
    Spec: https://llmstxt.org
    Public, no auth required. AI crawlers fetch this first.
    """
    content = (
        "# Galuli\n\n"
        "> Galuli is a Generative Engine Optimization (GEO) platform that measures, analyzes, and improves "
        "how websites appear in AI-generated answers from ChatGPT, Claude, Perplexity, Gemini, Grok, and Llama.\n\n"
        "Galuli was founded in 2025. Core capabilities:\n"
        "- AI Readiness Score (0-100 across 5 dimensions)\n"
        "- GEO Score for 6 major AI systems individually\n"
        "- AI Attention Score (composite: frequency, depth, recency, diversity of AI crawls)\n"
        "- Content Doctor: Authority Gap Scanner (finds claims AI won't trust) + Structural Optimizer\n"
        "- Topic Attention Map (which content areas AI agents read most)\n"
        "- Per-LLM crawl depth analysis (which AI systems go deep vs. skim)\n"
        "- Automatic llms.txt generation\n"
        "- WebMCP tool registration\n"
        "- AI agent traffic analytics\n"
        "Install takes one script tag.\n\n"
        "Pricing: Free tier (scan only, no credit card). Starter $9/month (1 site, JS monitoring). "
        "Pro $29/month (10 sites). Agency $799/year (unlimited sites).\n\n"
        "## Getting Started\n\n"
        "- [Home / Free Scan](https://galuli.io/): Scan any URL and get an instant AI Readiness Score\n"
        "- [Dashboard](https://galuli.io/dashboard/): Full analytics, GEO scores, Content Doctor, snippet, registry\n"
        "- [Pricing](https://galuli.io/pricing): Plans and feature comparison\n"
        "- [About](https://galuli.io/about): Company story, beliefs, full product overview\n"
        "- [Install Guide](https://galuli.io/install): Step-by-step install guide for WordPress, Webflow, Shopify, Next.js, Lovable, Replit, and more\n\n"
        "## Product Features\n\n"
        "- [AI Readiness Score](https://galuli.io/blog/ai-readiness-score): The 5 dimensions explained\n"
        "- [AI Attention Score](https://galuli.io/blog/ai-attention-score): How AI attention is measured and improved\n"
        "- [Content Doctor](https://galuli.io/blog/content-doctor): Authority gaps + structural optimization for GEO\n"
        "- [Roadmap](https://galuli.io/roadmap): Public 2026 roadmap with shipped and planned items\n\n"
        "## Blog / Education\n\n"
        "- [What is GEO?](https://galuli.io/blog/what-is-geo): Complete guide to Generative Engine Optimization\n"
        "- [llms.txt Guide](https://galuli.io/blog/llms-txt-guide): Format, examples, common mistakes, full AI-readability stack\n"
        "- [AI Agent Analytics](https://galuli.io/blog/ai-agent-analytics): Track the AI traffic you can't see in Google Analytics\n"
        "- [Future of Search](https://galuli.io/blog/future-of-search): How AI is rewriting online discovery\n"
        "- [robots.txt for AI Crawlers](https://galuli.io/blog/robots-txt-ai-crawlers): Are you accidentally blocking AI search engines?\n"
        "- [Information Gain for GEO](https://galuli.io/blog/information-gain-geo): Why generic content gets ignored by AI\n"
        "- [WebMCP Explained](https://galuli.io/blog/webmcp-explained): The standard that makes your website AI-interactive\n"
        "- [How to Get AI Citations](https://galuli.io/blog/how-to-get-ai-citations): What Perplexity, ChatGPT, and Claude actually cite\n"
        "- [AI-Readiness Tech Stack 2026](https://galuli.io/blog/ai-readiness-tech-stack-2026): All 5 layers every AI-visible website needs\n\n"
        "## API\n\n"
        "- [API Docs](https://galuli.io/docs): FastAPI interactive documentation\n"
        "- [Registry endpoint](https://galuli.io/registry/{domain}): JSON capability registry for any indexed domain\n"
        "- [llms.txt per domain](https://galuli.io/registry/{domain}/llms.txt): Auto-generated llms.txt for indexed sites\n"
        "- [AI Plugin manifest](https://galuli.io/registry/{domain}/ai-plugin.json): OpenAI-compatible plugin manifest\n\n"
        "## Contact\n\n"
        "- Email: hello@galuli.io\n"
        "- GitHub: https://github.com/yan-yanko/galuli\n"
    )
    return PlainTextResponse(content, headers={
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "text/plain; charset=utf-8",
    })


# ── Snippet delivery ───────────────────────────────────────────────────────

SNIPPET_VERSION = "3.3.0"
SNIPPET_RELEASED = "2026-02-25"

@app.get("/galuli.js", tags=["Snippet"], include_in_schema=False)
async def serve_snippet():
    """Serve the galuli.js snippet file (canonical URL)."""
    snippet_path = _pathlib.Path(__file__).parent.parent.parent / "static" / "galuli.js"
    if not snippet_path.exists():
        # Fall back to galui.js if galuli.js not found yet
        snippet_path = _pathlib.Path(__file__).parent.parent.parent / "static" / "galui.js"
    if not snippet_path.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Snippet not found")
    return FileResponse(str(snippet_path), media_type="application/javascript", headers={
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "Access-Control-Allow-Origin": "*",
        "X-Galuli-Version": SNIPPET_VERSION,
    })

@app.get("/galui.js", tags=["Snippet"], include_in_schema=False)
async def serve_snippet_legacy():
    """Backward-compat redirect — existing installs keep working."""
    return RedirectResponse(url="/galuli.js", status_code=301)

@app.get("/galuli.js/version", tags=["Snippet"], include_in_schema=False)
async def snippet_version():
    """Returns the current snippet version — for monitoring and debugging."""
    return {
        "version": SNIPPET_VERSION,
        "filename": "galuli.js",
        "released": SNIPPET_RELEASED,
        "legacy_redirect": "/galui.js → /galuli.js (301)",
    }

# ── Dashboard (React SPA) ──────────────────────────────────────────────────
# Served from /dashboard — built by Docker frontend stage
_dashboard_path = _pathlib.Path(__file__).parent.parent.parent / "static" / "dashboard"

if _dashboard_path.exists():
    # Serve the React SPA at both / and /dashboard/
    # The React app itself handles routing between landing and dashboard
    app.mount("/dashboard", StaticFiles(directory=str(_dashboard_path), html=True), name="dashboard")
    logger.info(f"  Dashboard:    /dashboard (React SPA)")
    logger.info(f"  Landing:      / (served from same SPA)")

    @app.get("/", include_in_schema=False)
    async def serve_landing():
        """Serve the React SPA at root — landing page."""
        index_path = _dashboard_path / "index.html"
        return FileResponse(str(index_path), media_type="text/html")

    # Catch-all: serve index.html for all frontend routes (blog, about, roadmap, etc.)
    # This must be LAST so it doesn't shadow API routes.
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_fallback(full_path: str):
        """SPA fallback — serve index.html for any non-API path so React Router handles it."""
        # Don't intercept API routes, registry, static files, or crawler files
        skip_prefixes = ("api/", "registry/", "docs", "redoc", "openapi", ".well-known/")
        skip_exact = {"robots.txt", "sitemap.xml", "llms.txt", "llms-full.txt",
                      "galuli.js", "galui.js", "favicon.ico", "favicon.svg"}
        if full_path.startswith(skip_prefixes) or full_path in skip_exact:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
        index_path = _dashboard_path / "index.html"
        return FileResponse(str(index_path), media_type="text/html")

else:
    logger.info("  Dashboard:    not built (run Docker to build)")

    @app.get("/", include_in_schema=False)
    async def serve_landing():
        return {"service": "galuli", "version": "3.3.0", "docs": "/docs", "dashboard": "not built"}
