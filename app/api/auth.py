"""
Authentication middleware.

Two modes:
1. MASTER KEY mode (REGISTRY_API_KEY set): single shared key — dev/admin use
2. TENANT KEY mode: per-tenant cr_live_* keys from DB

/registry/* is always public — agents need unauthenticated read access.
/health, /docs, /redoc are always public.
"""
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

PUBLIC_EXACT = {
    # System
    "/health", "/docs", "/redoc", "/openapi.json", "/docs/oauth2-redirect",
    # Landing
    "/", "/galui.js", "/galuli.js", "/galuli.js/version",
    # Crawler-critical — must NEVER require auth (robots, sitemaps, AI discovery files)
    "/robots.txt", "/sitemap.xml", "/sitemap_index.xml",
    "/llms.txt", "/llms-full.txt",
    "/.well-known/ai-plugin.json", "/.well-known/openapi.yaml",
    "/favicon.ico", "/favicon.svg",
}
# Registry + SPA files always public. Frontend routes (/blog, /about, /roadmap) served as SPA.
PUBLIC_PREFIXES = (
    "/registry/",
    "/dashboard",
    "/assets/",
    "/dashboard/assets/",
    "/blog",
    "/about",
    "/roadmap",
    "/pricing",
    "/auth",           # magic link verify page
    "/.well-known/",   # all well-known discovery files
    "/api/v1/score/",  # score + badge + suggestions — read-only, registry is already public
    "/api/v1/geo/",    # per-LLM citation readiness — read-only
)
# Self-service signup + auth + Stripe webhook: always public
PUBLIC_POST_EXACT = {
    "/api/v1/tenants",
    "/api/v1/auth/signup",
    "/api/v1/auth/login",
    "/api/v1/auth/magic-link",
    "/api/v1/billing/webhook",      # Stripe sends no auth header
    "/api/v1/billing/ls-webhook",   # Lemon Squeezy sends no auth header
    "/api/v1/push",                 # galuli.js snippet — auth via payload.tenant_key
    "/api/v1/analytics/event",      # galuli.js analytics — no auth needed (fire-and-forget)
}
PUBLIC_GET_EXACT = {
    "/api/v1/auth/magic-verify",
    "/api/v1/billing/plans",
}

# Endpoints that accept tenant keys (ingest, jobs)
TENANT_ENDPOINTS = ("/api/v1/ingest", "/api/v1/jobs")


class APIKeyMiddleware(BaseHTTPMiddleware):
    """
    NOTE: Uses JSONResponse not HTTPException — Starlette BaseHTTPMiddleware
    swallows HTTPExceptions raised inside middleware dispatch.
    """

    async def dispatch(self, request: Request, call_next):
        from app.config import settings

        path = request.url.path

        # Always public
        if path in PUBLIC_EXACT:
            return await call_next(request)
        if any(path.startswith(p) for p in PUBLIC_PREFIXES):
            return await call_next(request)
        # Public POST endpoints (signup, login, webhook)
        if request.method == "POST" and path in PUBLIC_POST_EXACT:
            return await call_next(request)
        # Public GET endpoints (magic verify, plans)
        if request.method == "GET" and path in PUBLIC_GET_EXACT:
            return await call_next(request)

        # No auth configured → open (dev mode)
        if not settings.registry_api_key:
            # Still try to attach tenant if key present (for usage tracking)
            api_key = request.headers.get("X-API-Key", "")
            if api_key and api_key.startswith("cr_"):
                tenant = _get_tenant(api_key)
                if tenant:
                    request.state.tenant = tenant
                    request.state.api_key = api_key
            return await call_next(request)

        # Auth required
        api_key = request.headers.get("X-API-Key", "")
        if not api_key:
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized", "detail": "X-API-Key header required"},
            )

        # Master key check
        if api_key == settings.registry_api_key:
            request.state.tenant = None
            request.state.api_key = api_key
            return await call_next(request)

        # Tenant key check
        if api_key.startswith("cr_"):
            tenant = _get_tenant(api_key)
            if tenant:
                request.state.tenant = tenant
                request.state.api_key = api_key
                return await call_next(request)

        logger.warning(f"Bad API key from {request.client.host if request.client else '?'}: {api_key[:15]}...")
        return JSONResponse(
            status_code=401,
            content={"error": "Unauthorized", "detail": "Invalid API key"},
        )


def _get_tenant(api_key: str):
    try:
        from app.services.tenant import TenantService
        ts = TenantService()
        return ts.get_tenant(api_key)
    except Exception:
        return None
