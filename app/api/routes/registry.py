import json
import logging
from datetime import datetime

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, PlainTextResponse

from app.models.registry import CapabilityRegistry
from app.services.storage import StorageService

logger = logging.getLogger(__name__)
router = APIRouter()
storage = StorageService()


@router.get("/", summary="List all indexed domains")
async def list_registries():
    """List all indexed domains with metadata."""
    registries = storage.list_registries()
    return {
        "count": len(registries),
        "registries": registries,
    }


@router.get("/{domain}", response_model=CapabilityRegistry, summary="Full JSON registry")
async def get_registry(domain: str):
    """
    Full machine-readable JSON registry for a domain.

    This is the primary endpoint for AI agents querying capability data.
    """
    domain = domain.replace("www.", "").lower().strip()
    registry = storage.get_registry(domain)
    if not registry:
        raise HTTPException(
            status_code=404,
            detail={
                "error": f"No registry found for '{domain}'",
                "hint": "POST /api/v1/ingest with the URL to create one",
            },
        )
    return registry


@router.get("/{domain}/llms.txt", response_class=PlainTextResponse, summary="LLM-readable text format")
async def get_llms_txt(domain: str):
    """
    LLM-readable plain text format for the capability registry.

    Follows the emerging llms.txt standard (analogous to robots.txt for AI).
    Designed to be fetched as context by AI agents evaluating whether to use this service.
    """
    domain = domain.replace("www.", "").lower().strip()
    registry = storage.get_registry(domain)
    if not registry:
        raise HTTPException(status_code=404, detail=f"No registry for '{domain}'")

    m = registry.metadata
    lines = [
        f"# {m.name}",
        "",
        f"> {m.description}",
        "",
        f"- Domain: {registry.domain}",
        f"- Category: {m.category}" + (f" / {', '.join(m.sub_categories)}" if m.sub_categories else ""),
        f"- Registry Updated: {registry.last_updated.strftime('%Y-%m-%d') if hasattr(registry.last_updated, 'strftime') else str(registry.last_updated)[:10]}",
        f"- Confidence Score: {registry.ai_metadata.confidence_score:.2f}",
    ]

    if m.website_url:
        lines.append(f"- Website: {m.website_url}")
    if m.docs_url:
        lines.append(f"- Docs: {m.docs_url}")

    lines += ["", "## Capabilities", ""]

    for cap in registry.capabilities:
        lines.append(f"### {cap.name}")
        lines.append(cap.description)
        if cap.problems_solved:
            lines.append(f"Solves: {'; '.join(cap.problems_solved)}")
        if cap.use_cases:
            lines.append(f"Use cases: {'; '.join(cap.use_cases[:3])}")
        if cap.constraints:
            lines.append(f"Constraints: {'; '.join(cap.constraints[:2])}")
        lines.append("")

    lines += ["## Pricing", ""]
    p = registry.pricing
    lines.append(f"Model: {p.model}")
    lines.append(f"Free tier: {'Yes' if p.has_free_tier else 'No'}")
    lines.append(f"Contact sales required: {'Yes' if p.contact_sales_required else 'No'}")

    if p.tiers:
        lines.append("")
        for tier in p.tiers:
            if tier.contact_sales:
                lines.append(f"- {tier.name}: Contact sales")
            elif tier.price_per_unit is not None:
                price_str = f"{tier.currency} {tier.price_per_unit}"
                if tier.unit:
                    price_str += f" {tier.unit}"
                if tier.plus_fixed:
                    price_str += f" + {tier.currency} {tier.plus_fixed}"
                lines.append(f"- {tier.name}: {price_str}")
                if tier.description:
                    lines.append(f"  {tier.description}")
            else:
                lines.append(f"- {tier.name}: {tier.description or 'See pricing page'}")

    if p.pricing_page_url:
        lines.append(f"\nPricing page: {p.pricing_page_url}")
    if p.pricing_notes:
        lines.append(f"Notes: {p.pricing_notes}")

    lines += ["", "## Integration", ""]
    i = registry.integration
    if i.api_base_url:
        lines.append(f"API base URL: {i.api_base_url}")
    if i.api_version:
        lines.append(f"API version: {i.api_version}")
    if i.auth_methods:
        lines.append(f"Auth methods: {', '.join(i.auth_methods)}")
    if i.auth_notes:
        lines.append(f"Auth notes: {i.auth_notes}")
    if i.sdks:
        lines.append(f"SDKs: {', '.join(s.language for s in i.sdks)}")
    lines.append(f"Webhooks: {'Supported' if i.webhooks_supported else 'Not documented'}")

    lines += ["", "## Reliability", ""]
    r = registry.reliability
    lines.append(f"Current status: {r.current_status}")
    if r.status_page_url:
        lines.append(f"Status page: {r.status_page_url}")
    if registry.limitations.sla_uptime_percent:
        lines.append(f"SLA uptime: {registry.limitations.sla_uptime_percent}%")

    # Check if we have page snapshots for this domain
    snapshots = storage.list_page_snapshots(domain)

    if snapshots:
        lines += [
            "",
            "## AI-Readable Page Content",
            "",
            f"This site has {len(snapshots)} cached page(s) with full rendered content.",
            f"For the complete content (useful if this site uses client-side JavaScript rendering),",
            f"see the llms-full.txt file:",
            "",
            f"- Full content: https://galuli.io/registry/{domain}/llms-full.txt",
            f"- All pages: https://galuli.io/registry/{domain}/pages",
            "",
        ]
        for snap in snapshots[:20]:
            lines.append(f"- [{snap.get('title') or snap['page_path']}](https://galuli.io/registry/{domain}/pages{snap['page_path']})")
        lines.append("")

    lines += [
        "",
        "## Machine-Readable Endpoints",
        "",
        f"JSON Registry: {registry.ai_metadata.registry_url}",
        f"Full Content: https://galuli.io/registry/{domain}/llms-full.txt",
        f"This file: {registry.ai_metadata.llms_txt_url}",
    ]

    lines += ["", "---", f"Generated by Galuli | Last crawled: {registry.last_updated.strftime('%Y-%m-%d') if hasattr(registry.last_updated, 'strftime') else str(registry.last_updated)[:10]}"]

    return "\n".join(lines)


@router.get("/{domain}/llms-full.txt", response_class=PlainTextResponse,
             summary="Full LLM-readable content — all pages in markdown")
async def get_llms_full_txt(domain: str):
    """
    Complete AI-readable content for all cached pages of a domain.

    Generated from real user visits via galuli.js. Contains the full rendered
    content that AI crawlers cannot see on JavaScript-rendered SPAs.

    This is the key endpoint that solves SPA invisibility for AI engines.
    Follows the llms-full.txt convention from the llms.txt spec.
    """
    domain = domain.replace("www.", "").lower().strip()
    snapshots = storage.get_all_snapshots_full(domain)

    if not snapshots:
        # Fall back to registry-based llms.txt if no snapshots yet
        raise HTTPException(
            status_code=404,
            detail=f"No cached pages for '{domain}'. Install galuli.js to start capturing page content."
        )

    lines = [
        f"# {domain} — Full Site Content",
        "",
        f"> This document contains the complete readable content of {domain},",
        f"> captured from real browser visits via Galuli. AI crawlers that cannot",
        f"> execute JavaScript can use this as the canonical content source.",
        "",
        f"Pages: {len(snapshots)}",
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d')}",
        f"Source: https://galuli.io/registry/{domain}/pages",
        "",
        "---",
        "",
    ]

    for snap in snapshots:
        title = snap.get("title", "") or snap.get("page_path", "/")
        desc = snap.get("description", "")
        text = snap.get("text_content", "")
        page_url = snap.get("page_url", "")
        page_path = snap.get("page_path", "/")
        headings = []
        try:
            headings = json.loads(snap.get("headings_json", "[]"))
        except (json.JSONDecodeError, TypeError):
            pass

        lines.append(f"## {title}")
        lines.append(f"URL: {page_url}")
        lines.append(f"Path: {page_path}")
        if desc:
            lines.append(f"Description: {desc}")
        lines.append("")

        # Include headings as structure
        if headings:
            for h in headings:
                if isinstance(h, dict):
                    level = h.get("level", 3)
                    text_h = h.get("text", "")
                    lines.append(f"{'#' * min(level + 1, 6)} {text_h}")
                elif isinstance(h, str):
                    lines.append(f"### {h}")
            lines.append("")

        # Include full text content
        if text:
            lines.append(text)
        lines.append("")
        lines.append("---")
        lines.append("")

    lines.append(f"Powered by Galuli — https://galuli.io")
    lines.append(f"Registry: https://galuli.io/registry/{domain}")

    return PlainTextResponse(
        "\n".join(lines),
        headers={
            "Cache-Control": "public, max-age=3600",
            "Content-Type": "text/plain; charset=utf-8",
            "X-Galuli-Pages": str(len(snapshots)),
        }
    )


@router.get("/{domain}/pages", summary="List all cached page snapshots")
async def list_page_snapshots(domain: str):
    """
    List all page snapshots captured by galuli.js for a domain.
    Each entry links to the AI-readable HTML version.
    """
    domain = domain.replace("www.", "").lower().strip()
    snapshots = storage.list_page_snapshots(domain)
    return {
        "domain": domain,
        "count": len(snapshots),
        "pages": [
            {
                "path": s["page_path"],
                "url": s["page_url"],
                "title": s["title"],
                "description": s["description"],
                "cached_url": f"https://galuli.io/registry/{domain}/pages{s['page_path']}",
                "updated_at": s["updated_at"],
            }
            for s in snapshots
        ],
        "llms_full_txt": f"https://galuli.io/registry/{domain}/llms-full.txt",
    }


@router.get("/{domain}/pages/{page_path:path}",
             response_class=HTMLResponse,
             summary="AI-readable HTML snapshot of a page")
async def get_page_snapshot(domain: str, page_path: str):
    """
    Serves a clean, server-rendered HTML version of a JavaScript-rendered page.

    This is the core of Galuli's SPA visibility solution: galuli.js captures
    the fully rendered DOM from real user visits, and this endpoint serves it
    as static HTML that AI crawlers can read without executing JavaScript.
    """
    domain = domain.replace("www.", "").lower().strip()
    # Normalize path
    normalized_path = "/" + page_path.strip("/") if page_path.strip("/") else "/"

    snapshot = storage.get_page_snapshot(domain, normalized_path)
    if not snapshot:
        raise HTTPException(status_code=404, detail=f"No cached snapshot for {domain}{normalized_path}")

    title = snapshot.get("title", domain)
    description = snapshot.get("description", "")
    html_content = snapshot.get("html_snapshot", "")
    text_content = snapshot.get("text_content", "")
    original_url = snapshot.get("page_url", f"https://{domain}{normalized_path}")

    # Build clean, semantic HTML that AI crawlers can parse
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{_escape_html(title)}</title>
    <meta name="description" content="{_escape_html(description)}">
    <link rel="canonical" href="{_escape_html(original_url)}">
    <meta name="robots" content="index, follow">
    <meta property="og:title" content="{_escape_html(title)}">
    <meta property="og:description" content="{_escape_html(description)}">
    <meta property="og:url" content="{_escape_html(original_url)}">
    <meta property="og:type" content="website">
    <meta name="galuli-snapshot" content="true">
    <meta name="galuli-source" content="{_escape_html(original_url)}">
    <meta name="galuli-cached" content="{snapshot.get('updated_at', '')}">
</head>
<body>
    <header>
        <h1>{_escape_html(title)}</h1>
        {f'<p>{_escape_html(description)}</p>' if description else ''}
        <p><small>Original: <a href="{_escape_html(original_url)}">{_escape_html(original_url)}</a></small></p>
    </header>
    <main>
        {html_content if html_content else f'<article>{_escape_html(text_content)}</article>'}
    </main>
    <footer>
        <p>Cached by <a href="https://galuli.io">Galuli</a> — AI-readable snapshot of {_escape_html(domain)}</p>
    </footer>
</body>
</html>"""

    return HTMLResponse(
        html,
        headers={
            "Cache-Control": "public, max-age=3600",
            "X-Galuli-Snapshot": "true",
            "X-Galuli-Source": original_url,
        }
    )


def _escape_html(text: str) -> str:
    """Escape HTML special characters."""
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


@router.get("/{domain}/ai-plugin.json", summary="OpenAI-compatible plugin manifest")
async def get_ai_plugin(domain: str):
    """
    OpenAI-compatible ai-plugin.json manifest.
    Allows ChatGPT plugins and compatible agents to discover this service.
    """
    domain = domain.replace("www.", "").lower().strip()
    registry = storage.get_registry(domain)
    if not registry:
        raise HTTPException(status_code=404, detail=f"No registry for '{domain}'")

    m = registry.metadata
    cap_names = ", ".join(c.name for c in registry.capabilities[:3])
    description_for_model = (
        f"{m.description} Category: {m.category}."
        + (f" Capabilities: {cap_names}." if cap_names else "")
    )

    return {
        "schema_version": "v1",
        "name_for_human": m.name,
        "name_for_model": m.name.lower().replace(" ", "_"),
        "description_for_human": m.description,
        "description_for_model": description_for_model,
        "auth": {"type": "none"},
        "api": {
            "type": "openapi",
            "url": registry.integration.openapi_url or f"https://{domain}/openapi.json",
            "is_user_authenticated": False,
        },
        "logo_url": m.logo_url or f"https://{domain}/favicon.ico",
        "contact_email": f"support@{domain}",
        "legal_info_url": f"https://{domain}/legal",
    }


@router.get("/{domain}/status", summary="Live liveness check")
async def get_live_status(domain: str):
    """
    Real-time liveness check for a registered domain.

    Pings the service's status page (if known) or the domain directly.
    Returns current operational status without updating the stored registry.
    """
    domain = domain.replace("www.", "").lower().strip()
    registry = storage.get_registry(domain)
    if not registry:
        raise HTTPException(status_code=404, detail=f"No registry for '{domain}'")

    status = "unknown"
    checked_url = registry.reliability.status_page_url or f"https://{domain}"

    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            resp = await client.get(checked_url)
            if resp.status_code < 300:
                status = "operational"
            elif resp.status_code < 500:
                status = "degraded"
            else:
                status = "outage"
    except httpx.TimeoutException:
        status = "unreachable"
    except Exception:
        status = "unreachable"

    return {
        "domain": domain,
        "status": status,
        "checked_url": checked_url,
        "checked_at": datetime.utcnow().isoformat(),
        "stored_status": registry.reliability.current_status,
    }
