"""
Content Doctor — AI-powered content optimization for GEO.

Sprint 2: Authority Architect

Two analysis modes:
  1. Authority Gap Scanner    — find claims lacking empirical backing, suggest citations/data
  2. Structural Optimizer     — suggest converting dense paragraphs → tables, add Key Takeaways,
                                improve entity definitions for AI grounding

Uses Claude (fast model) for lightweight structured analysis.
Input: raw page text / markdown scraped by the existing crawler.
"""
import asyncio
import logging
import json
import re
from typing import Optional, Dict, Any, List

from app.prompts import load_prompt

logger = logging.getLogger(__name__)

# ── Prompts (loaded from app/prompts/*.txt) ────────────────────────────────────
AUTHORITY_GAP_PROMPT = load_prompt("authority_gap")
STRUCTURAL_OPTIMIZER_PROMPT = load_prompt("structural_optimizer")


# ── Service ────────────────────────────────────────────────────────────────────

class ContentDoctorService:
    """
    Analyzes page content for GEO improvements.

    Uses the fast Claude model to minimize latency + cost.
    Each analysis is stateless — no caching at service level
    (caching can be added at route level if needed).
    """

    def __init__(self):
        from app.config import settings
        self.api_key = settings.anthropic_api_key
        self.fast_model = settings.fast_model

    async def _call_claude(self, prompt: str, content: str, max_tokens: int = 2000) -> Dict:
        """
        Call Claude asynchronously with a content analysis prompt.
        Returns parsed JSON dict or raises on failure.
        """
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=self.api_key)

        # Truncate very long content to stay within token budget
        MAX_CONTENT_CHARS = 8000
        if len(content) > MAX_CONTENT_CHARS:
            content = content[:MAX_CONTENT_CHARS] + "\n\n[Content truncated for analysis]"

        full_prompt = prompt.format(content=content)

        message = await client.messages.create(
            model=self.fast_model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": full_prompt}],
        )

        raw = message.content[0].text.strip()

        # Strip markdown code fences if model adds them despite instructions
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        return json.loads(raw)

    async def analyze_authority_gaps(self, content: str, url: str = "") -> Dict[str, Any]:
        """
        Run Authority Gap Scanner on page content.

        Args:
            content: Raw text or markdown of the page
            url:     Source URL (for context, not analyzed)

        Returns:
            Dict with authority_score, gaps, strengths, quick_wins
        """
        if not content or len(content.strip()) < 100:
            return {
                "url": url,
                "error": "Content too short for meaningful analysis (minimum 100 chars)",
                "authority_score": 0,
                "gaps": [],
                "strengths": [],
                "quick_wins": [],
            }

        try:
            result = await self._call_claude(AUTHORITY_GAP_PROMPT, content)
            result["url"] = url
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Authority gap JSON parse error: {e}")
            return {"url": url, "error": "Analysis failed — could not parse AI response", "authority_score": 0, "gaps": []}
        except Exception as e:
            logger.error(f"Authority gap analysis failed: {e}")
            return {"url": url, "error": str(e), "authority_score": 0, "gaps": []}

    async def analyze_structure(self, content: str, url: str = "") -> Dict[str, Any]:
        """
        Run Structural Optimizer on page content.

        Args:
            content: Raw text or markdown of the page
            url:     Source URL (for context)

        Returns:
            Dict with structure_score, issues, suggested_sections, rewrite_candidates
        """
        if not content or len(content.strip()) < 100:
            return {
                "url": url,
                "error": "Content too short for meaningful analysis (minimum 100 chars)",
                "structure_score": 0,
                "issues": [],
                "suggested_sections": [],
                "rewrite_candidates": [],
            }

        try:
            result = await self._call_claude(STRUCTURAL_OPTIMIZER_PROMPT, content)
            result["url"] = url
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Structure analysis JSON parse error: {e}")
            return {"url": url, "error": "Analysis failed — could not parse AI response", "structure_score": 0, "issues": []}
        except Exception as e:
            logger.error(f"Structure analysis failed: {e}")
            return {"url": url, "error": str(e), "structure_score": 0, "issues": []}

    async def full_diagnosis(self, content: str, url: str = "") -> Dict[str, Any]:
        """
        Run both Authority Gap + Structural analysis in parallel.
        Returns combined report.
        """
        authority, structure = await asyncio.gather(
            self.analyze_authority_gaps(content, url),
            self.analyze_structure(content, url),
        )

        # Combined content health score (weighted average)
        a_score = authority.get("authority_score", 0)
        ig_score = authority.get("information_gain_score", a_score)  # fallback if old analysis
        s_score = structure.get("structure_score", 0)
        # Weight: authority 35%, information gain 35%, structure 30%
        combined = round((a_score * 0.35) + (ig_score * 0.35) + (s_score * 0.30))

        # Grade
        if combined >= 85:
            grade = "A"
        elif combined >= 70:
            grade = "B"
        elif combined >= 55:
            grade = "C"
        elif combined >= 40:
            grade = "D"
        else:
            grade = "F"

        # Top priority across both analyses
        priorities = []
        if authority.get("top_priority"):
            priorities.append(f"[Authority] {authority['top_priority']}")
        if structure.get("top_priority"):
            priorities.append(f"[Structure] {structure['top_priority']}")

        report = {
            "url": url,
            "content_health_score": combined,
            "grade": grade,
            "authority_score": a_score,
            "information_gain_score": ig_score,
            "structure_score": s_score,
            "authority": authority,
            "structure": structure,
            "top_priorities": priorities,
            "quick_wins": authority.get("quick_wins", []),
            "information_gain_issues": authority.get("information_gain_issues", []),
        }
        return self._compress_report(report)

    @staticmethod
    def _compress_report(report: Dict) -> Dict:
        """Truncate verbose LLM fields to keep response payload small."""
        def _trunc(s, limit):
            return s[:limit] + "..." if isinstance(s, str) and len(s) > limit else s

        for section_key in ("authority", "structure"):
            section = report.get(section_key)
            if not isinstance(section, dict):
                continue
            for gap in section.get("gaps", []):
                for field in ("suggestion", "example_fix", "ai_risk"):
                    if field in gap:
                        gap[field] = _trunc(gap[field], 200)
            for issue in section.get("issues", []):
                if "example" in issue:
                    issue["example"] = _trunc(issue["example"], 300)
            for rc in section.get("rewrite_candidates", []):
                if "original" in rc:
                    rc["original"] = _trunc(rc["original"], 300)
        return report

    async def analyze_from_registry(self, domain: str) -> Dict[str, Any]:
        """
        Pull page content from the existing registry (already crawled)
        and run Content Doctor on the top pages.

        Returns a domain-level report with per-page diagnoses.
        """
        from app.services.storage import StorageService
        storage = StorageService()
        registry = storage.get_registry(domain)

        if not registry:
            return {
                "domain": domain,
                "error": f"No registry found for {domain}. Run an ingest job first.",
                "pages": [],
            }

        pages_analyzed = []

        # Analyze up to 5 pages from the registry (cost/latency budget)
        capabilities = getattr(registry, "capabilities", [])
        pages_to_analyze = capabilities[:5] if capabilities else []

        for cap in pages_to_analyze:
            url = getattr(cap, "url", "") or getattr(cap, "page_url", "")
            # Build content from registry fields available
            content_parts = []
            if getattr(cap, "name", ""):
                content_parts.append(f"# {cap.name}")
            if getattr(cap, "description", ""):
                content_parts.append(cap.description)
            if getattr(cap, "content", ""):
                content_parts.append(cap.content)

            content = "\n\n".join(content_parts)

            if content.strip():
                diagnosis = await self.full_diagnosis(content, url)
                pages_analyzed.append(diagnosis)

        if not pages_analyzed:
            return {
                "domain": domain,
                "error": "No page content available in registry for analysis.",
                "pages": [],
            }

        # Domain-level summary
        avg_health = round(sum(p.get("content_health_score", 0) for p in pages_analyzed) / len(pages_analyzed))
        avg_authority = round(sum(p.get("authority", {}).get("authority_score", 0) for p in pages_analyzed) / len(pages_analyzed))
        avg_structure = round(sum(p.get("structure", {}).get("structure_score", 0) for p in pages_analyzed) / len(pages_analyzed))

        return {
            "domain": domain,
            "pages_analyzed": len(pages_analyzed),
            "domain_health_score": avg_health,
            "domain_authority_score": avg_authority,
            "domain_structure_score": avg_structure,
            "pages": pages_analyzed,
        }
