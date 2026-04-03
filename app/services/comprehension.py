import asyncio
import json
import logging
from typing import Any, Dict

import anthropic

from app.models.crawl import CrawlResult
from app.prompts import load_prompt

logger = logging.getLogger(__name__)

# ── Prompts (loaded from app/prompts/*.txt) ──────────────────────────────────
METADATA_PROMPT = load_prompt("metadata")
CAPABILITIES_PROMPT = load_prompt("capabilities")
PRICING_PROMPT = load_prompt("pricing")
LIMITATIONS_PROMPT = load_prompt("limitations")


class ComprehensionService:
    """
    Four-pass LLM pipeline to extract CapabilityRegistry fields from crawled content.

    Pass 1 (Haiku):  Metadata + integration fields — structured extraction
    Pass 2 (Sonnet): Capabilities — requires genuine product comprehension
    Pass 3 (Haiku):  Pricing — structured extraction from pricing page
    Pass 4 (Sonnet): Limitations — requires inferencing from scattered content

    Estimated cost: ~$0.01-0.05 per domain crawl.
    """

    def __init__(self):
        from app.config import settings
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.fast_model = settings.fast_model
        self.deep_model = settings.deep_model

    async def extract(self, crawl_result: CrawlResult) -> Dict[str, Any]:
        """
        Run full extraction pipeline — all 4 passes in parallel.
        Returns raw dict; registry_builder.py normalizes to schema.
        """
        full_content = self._prepare_content(crawl_result)
        pricing_content = self._get_pricing_content(crawl_result)

        logger.info(f"[{crawl_result.domain}] Running 4 LLM passes in parallel")

        metadata_raw, capabilities_raw, pricing_raw, limitations_raw = await asyncio.gather(
            self._call_llm(
                model=self.fast_model,
                prompt=METADATA_PROMPT.format(content=full_content[:30_000]),
                max_tokens=2000,
            ),
            self._call_llm(
                model=self.deep_model,
                prompt=CAPABILITIES_PROMPT.format(content=full_content[:60_000]),
                max_tokens=3000,
            ),
            self._call_llm(
                model=self.fast_model,
                prompt=PRICING_PROMPT.format(content=pricing_content),
                max_tokens=1500,
            ),
            self._call_llm(
                model=self.deep_model,
                prompt=LIMITATIONS_PROMPT.format(content=full_content[:40_000]),
                max_tokens=1500,
            ),
        )

        logger.info(f"[{crawl_result.domain}] All 4 passes complete")

        return {
            "metadata": metadata_raw,
            "capabilities": capabilities_raw,
            "pricing": pricing_raw,
            "limitations": limitations_raw,
            "pages_crawled": crawl_result.total_pages,
        }

    def _prepare_content(self, crawl_result: CrawlResult) -> str:
        """Concatenate all pages with URL headers for LLM context."""
        parts = []
        for page in crawl_result.pages:
            parts.append(f"=== PAGE: {page.url} ===\n{page.text[:5_000]}")
        return "\n\n".join(parts)

    def _get_pricing_content(self, crawl_result: CrawlResult) -> str:
        """Prefer pricing page; fall back to full content."""
        for page in crawl_result.pages:
            if any(kw in page.url.lower() for kw in ["/pricing", "/price", "/plans"]):
                full = f"=== PRICING PAGE: {page.url} ===\n{page.text}"
                # Include homepage too for context
                if crawl_result.pages:
                    full += f"\n\n=== HOMEPAGE ===\n{crawl_result.pages[0].text[:3_000]}"
                return full
        # Fallback: first 20k of full content
        return self._prepare_content(crawl_result)[:20_000]

    async def _call_llm(self, model: str, prompt: str, max_tokens: int) -> Any:
        """
        Call Claude asynchronously. Parse JSON response.
        Return empty fallback on failure — never raises.
        """
        try:
            message = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            content = message.content[0].text.strip()

            # Strip markdown code fences if model wraps response
            if content.startswith("```"):
                parts = content.split("```")
                if len(parts) >= 2:
                    content = parts[1]
                    if content.startswith("json"):
                        content = content[4:]
                    content = content.strip()

            return json.loads(content)

        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error from {model}: {e}")
            return {} if "PROMPT" not in prompt or "array" not in prompt else []
        except anthropic.APIError as e:
            logger.error(f"Anthropic API error ({model}): {e}")
            return {}
        except Exception as e:
            logger.error(f"LLM call failed ({model}): {e}", exc_info=True)
            return {}
