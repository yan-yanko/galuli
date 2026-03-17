"""
Entity Establishment Checker — Layer 1 of The Stack.

Checks if a domain is a resolved entity across the sources AI systems
actually use for entity resolution: Wikidata, Schema.org, directory platforms,
and robots.txt crawl access.

No snippet install needed. Runs against any public domain in ~3-5 seconds.
Based on: https://www.linkedin.com/pulse/how-ai-visibility-actually-works (88 sources)
"""
import asyncio
import json
import logging
from typing import Any, Dict, List

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

TIMEOUT = 8.0
UA = "Galuli-EntityChecker/1.0 (+https://galuli.io/bot)"

# SSRF protection — block private/loopback ranges and non-public TLDs
_BLOCKED_HOSTS = {
    "localhost", "127.0.0.1", "0.0.0.0", "::1",
    "169.254.169.254",   # AWS metadata
    "metadata.google.internal",
}
_PRIVATE_PREFIXES = ("10.", "172.16.", "172.17.", "172.18.", "172.19.",
                     "172.20.", "172.21.", "172.22.", "172.23.", "172.24.",
                     "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
                     "172.30.", "172.31.", "192.168.")


def _is_safe_domain(domain: str) -> bool:
    """Return False if domain looks like a private/internal host."""
    host = domain.split(":")[0].lower()
    if host in _BLOCKED_HOSTS:
        return False
    if any(host.startswith(p) for p in _PRIVATE_PREFIXES):
        return False
    if "." not in host:
        return False   # bare hostname, no TLD
    return True

# Directory platforms AI systems use for entity resolution (K mechanism)
DIRECTORY_PLATFORMS = [
    {"name": "Crunchbase",   "domain": "crunchbase.com",      "fix": "https://crunchbase.com/add-company"},
    {"name": "LinkedIn",     "domain": "linkedin.com/company", "fix": "https://linkedin.com/company/setup/new"},
    {"name": "G2",           "domain": "g2.com",               "fix": "https://sell.g2.com"},
    {"name": "Capterra",     "domain": "capterra.com",         "fix": "https://vendors.capterra.com"},
    {"name": "Product Hunt", "domain": "producthunt.com",      "fix": "https://producthunt.com/posts/new"},
    {"name": "Trustpilot",   "domain": "trustpilot.com",       "fix": "https://business.trustpilot.com"},
    {"name": "Clutch",       "domain": "clutch.co",            "fix": "https://clutch.co/get-listed"},
]

AI_CRAWLERS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "Bingbot"]


async def check_entity(domain: str) -> Dict[str, Any]:
    """
    Run all L1 entity establishment checks for a domain.
    Returns per-check results + overall L1 score (0–35).
    """
    domain = domain.replace("www.", "").lower().strip()
    if not _is_safe_domain(domain):
        raise ValueError(f"Domain not allowed: {domain}")
    base_url = f"https://{domain}"

    async with httpx.AsyncClient(
        timeout=TIMEOUT,
        follow_redirects=True,
        headers={"User-Agent": UA},
    ) as client:
        homepage_task  = _fetch_homepage(client, base_url)
        robots_task    = _fetch_robots(client, base_url)
        wikidata_task  = _check_wikidata(domain)

        homepage_html, robots_txt, wikidata_result = await asyncio.gather(
            homepage_task, robots_task, wikidata_task,
            return_exceptions=True,
        )

    homepage_html  = homepage_html  if isinstance(homepage_html, str)  else ""
    robots_txt     = robots_txt     if isinstance(robots_txt, str)      else ""
    wikidata_result = wikidata_result if isinstance(wikidata_result, dict) else {"found": False}

    schema_result    = _check_schema_org(homepage_html)
    directory_result = _check_directories(homepage_html)
    robots_result    = _check_robots(robots_txt)

    checks = _build_checks(schema_result, robots_result, wikidata_result, directory_result)
    score  = _compute_l1_score(schema_result, robots_result, wikidata_result, directory_result)

    return {
        "domain": domain,
        "l1_score": score,
        "l1_max": 35,
        "checks": checks,
        "summary": _summary(checks),
        "framework": "The Stack — Layer 1: Entity Establishment",
    }


# ── Fetchers ─────────────────────────────────────────────────────────────────

async def _fetch_homepage(client: httpx.AsyncClient, base_url: str) -> str:
    try:
        resp = await client.get(base_url)
        if resp.status_code < 400:
            return resp.text
    except Exception as e:
        logger.warning(f"Homepage fetch failed {base_url}: {e}")
    return ""


async def _fetch_robots(client: httpx.AsyncClient, base_url: str) -> str:
    try:
        resp = await client.get(f"{base_url}/robots.txt")
        if resp.status_code == 200:
            return resp.text
    except Exception as e:
        logger.warning(f"robots.txt fetch failed {base_url}: {e}")
    return ""


async def _check_wikidata(domain: str) -> Dict[str, Any]:
    """Search Wikidata for an entity associated with this domain."""
    company_name = domain.split(".")[0].replace("-", " ").replace("_", " ").title()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://www.wikidata.org/w/api.php",
                params={
                    "action": "wbsearchentities",
                    "search": company_name,
                    "type": "item",
                    "language": "en",
                    "format": "json",
                    "limit": 5,
                },
                headers={"User-Agent": UA},
            )
            if resp.status_code == 200:
                results = resp.json().get("search", [])
                name_lc = company_name.lower()
                for item in results:
                    label = (item.get("label") or "").lower()
                    desc  = (item.get("description") or "").lower()
                    if name_lc in label or name_lc in desc:
                        return {
                            "found": True,
                            "entity_id": item.get("id"),
                            "label": item.get("label"),
                            "description": item.get("description"),
                        }
                return {"found": False, "results_count": len(results)}
    except Exception as e:
        logger.warning(f"Wikidata check failed for {domain}: {e}")
    return {"found": False}


# ── Parsers ──────────────────────────────────────────────────────────────────

def _check_schema_org(html: str) -> Dict[str, Any]:
    """Check for Organization / LocalBusiness / FAQPage schema.org markup."""
    if not html:
        return {"has_organization": False, "has_faq": False, "types": []}

    types, has_org, has_faq = [], False, False
    soup = BeautifulSoup(html, "lxml")

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            items = [data] if isinstance(data, dict) else (data if isinstance(data, list) else [])
            for item in items:
                t = item.get("@type", "")
                t_list = t if isinstance(t, list) else ([t] if t else [])
                types.extend(t_list)
                if any(x in ["Organization", "LocalBusiness", "Corporation", "SoftwareApplication"] for x in t_list):
                    has_org = True
                if "FAQPage" in t_list:
                    has_faq = True
        except Exception:
            pass

    return {"has_organization": has_org, "has_faq": has_faq, "types": list(set(types))}


def _check_directories(html: str) -> Dict[str, Any]:
    """Find outbound links to key directory platforms in homepage HTML."""
    if not html:
        return {"found": [], "missing": DIRECTORY_PLATFORMS}

    found, missing = [], []
    for platform in DIRECTORY_PLATFORMS:
        if platform["domain"] in html:
            found.append(platform["name"])
        else:
            missing.append(platform)

    return {"found": found, "missing": missing}


def _check_robots(robots_txt: str) -> Dict[str, Any]:
    """Check whether AI crawlers are blocked."""
    if not robots_txt:
        return {"has_robots_txt": False, "blocks_ai_crawlers": False, "blocked": [], "allowed": []}

    blocked, allowed, current_agents = [], [], []

    for line in robots_txt.splitlines():
        line = line.strip()
        if line.startswith("#"):
            continue
        if line.lower().startswith("user-agent:"):
            agent = line.split(":", 1)[1].strip()
            current_agents = [agent]
        elif line.lower().startswith("disallow:") and current_agents:
            path = line.split(":", 1)[1].strip()
            if path in ("/", "/*"):
                for agent in current_agents:
                    for crawler in AI_CRAWLERS:
                        if crawler.lower() in agent.lower() or agent == "*":
                            if crawler not in blocked:
                                blocked.append(crawler)
        elif line.lower().startswith("allow:") and current_agents:
            for agent in current_agents:
                for crawler in AI_CRAWLERS:
                    if crawler.lower() in agent.lower():
                        if crawler not in allowed:
                            allowed.append(crawler)

    # Explicit Allow overrides wildcard Disallow
    for a in allowed:
        if a in blocked:
            blocked.remove(a)

    return {
        "has_robots_txt": True,
        "blocks_ai_crawlers": len(blocked) > 0,
        "blocked": blocked,
        "allowed": allowed,
    }


# ── Check builder ─────────────────────────────────────────────────────────────

def _build_checks(
    schema: Dict, robots: Dict, wikidata: Dict, directories: Dict
) -> List[Dict]:
    checks = []

    # Schema.org Organization
    checks.append({
        "id": "schema_org",
        "label": "Schema.org Organization markup",
        "layer": "L1",
        "mechanism": "K — Knowledge Graph",
        "status": "pass" if schema["has_organization"] else "fail",
        "detail": (
            "Organization schema detected — AI engines can resolve your entity"
            if schema["has_organization"]
            else "Missing. Add Organization JSON-LD so AI engines can resolve who you are."
        ),
        "fix_url": "https://schema.org/Organization",
    })

    # Schema.org FAQ
    checks.append({
        "id": "schema_faq",
        "label": "FAQPage schema markup",
        "layer": "L1 + L4",
        "mechanism": "K + R — Knowledge Graph + Retrieval",
        "status": "pass" if schema["has_faq"] else "warn",
        "detail": (
            "FAQPage schema detected — cited 3x more often by AI retrieval systems"
            if schema["has_faq"]
            else "Not found. FAQPage JSON-LD is retrieved 3x more often than plain content."
        ),
        "fix_url": "https://schema.org/FAQPage",
    })

    # Wikidata
    checks.append({
        "id": "wikidata",
        "label": "Wikidata entity",
        "layer": "L1",
        "mechanism": "K — Knowledge Graph",
        "status": "pass" if wikidata.get("found") else "warn",
        "detail": (
            f"Entity found: {wikidata.get('label', 'present')} — {wikidata.get('description', '')}"
            if wikidata.get("found")
            else "Not found. A Wikidata entry strengthens AI entity resolution significantly."
        ),
        "fix_url": "https://www.wikidata.org/wiki/Special:NewItem",
    })

    # robots.txt
    if not robots["has_robots_txt"]:
        checks.append({
            "id": "robots_txt",
            "label": "robots.txt — AI crawl access",
            "layer": "L1",
            "mechanism": "R — Retrieval",
            "status": "warn",
            "detail": "No robots.txt found. AI crawlers default to allowed but this is unverified.",
            "fix_url": "https://galuli.io/blog/robots-txt-ai-crawlers",
        })
    elif robots["blocks_ai_crawlers"]:
        blocked_str = ", ".join(robots["blocked"][:3])
        checks.append({
            "id": "robots_txt",
            "label": "robots.txt — AI crawl access",
            "layer": "L1",
            "mechanism": "R — Retrieval",
            "status": "fail",
            "detail": f"Blocking AI crawlers: {blocked_str}. They cannot index or cite your content.",
            "fix_url": "https://galuli.io/blog/robots-txt-ai-crawlers",
            "blocked": robots["blocked"],
        })
    else:
        checks.append({
            "id": "robots_txt",
            "label": "robots.txt — AI crawl access",
            "layer": "L1",
            "mechanism": "R — Retrieval",
            "status": "pass",
            "detail": "AI crawlers are allowed to index your site.",
            "fix_url": None,
        })

    # Directory presence
    found_dirs   = directories.get("found", [])
    missing_dirs = directories.get("missing", [])
    if found_dirs:
        checks.append({
            "id": "directories",
            "label": f"Directory presence ({len(found_dirs)} of {len(DIRECTORY_PLATFORMS)} detected)",
            "layer": "L1",
            "mechanism": "K — Knowledge Graph",
            "status": "pass" if len(found_dirs) >= 3 else "warn",
            "detail": f"Linked from: {', '.join(found_dirs)}",
            "fix_url": None,
            "missing": [{"name": m["name"], "fix": m["fix"]} for m in missing_dirs[:4]],
        })
    else:
        checks.append({
            "id": "directories",
            "label": "Directory presence",
            "layer": "L1",
            "mechanism": "K — Knowledge Graph",
            "status": "fail",
            "detail": "No directory links found on homepage. Crunchbase, G2, and LinkedIn are key entity resolution sources for AI.",
            "fix_url": None,
            "missing": [{"name": m["name"], "fix": m["fix"]} for m in missing_dirs[:5]],
        })

    return checks


# ── Scoring ───────────────────────────────────────────────────────────────────

def _compute_l1_score(
    schema: Dict, robots: Dict, wikidata: Dict, directories: Dict
) -> int:
    pts = 0

    if schema["has_organization"]:
        pts += 10
    if schema["has_faq"]:
        pts += 7
    if wikidata.get("found"):
        pts += 5
    if robots["has_robots_txt"] and not robots["blocks_ai_crawlers"]:
        pts += 8
    elif not robots["has_robots_txt"]:
        pts += 4  # permissive by default, but unverified
    # directories: 2pts each, up to 5pts
    pts += min(len(directories.get("found", [])) * 2, 5)

    return min(pts, 35)


def _summary(checks: List[Dict]) -> Dict[str, int]:
    return {
        "pass": sum(1 for c in checks if c["status"] == "pass"),
        "warn": sum(1 for c in checks if c["status"] == "warn"),
        "fail": sum(1 for c in checks if c["status"] == "fail"),
    }
