"""Simple dict-based TTL cache for score/GEO endpoints."""
import time
from typing import Any, Optional

_cache: dict[str, tuple[float, Any]] = {}
DEFAULT_TTL = 300  # 5 minutes


def get(key: str) -> Optional[Any]:
    """Return cached value if not expired, else None."""
    entry = _cache.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if time.monotonic() > expires_at:
        del _cache[key]
        return None
    return value


def set(key: str, value: Any, ttl: int = DEFAULT_TTL) -> None:
    """Cache a value with TTL in seconds."""
    _cache[key] = (time.monotonic() + ttl, value)


def invalidate(prefix: str = "") -> None:
    """Remove all entries matching prefix, or all entries if empty."""
    if not prefix:
        _cache.clear()
        return
    keys = [k for k in _cache if k.startswith(prefix)]
    for k in keys:
        del _cache[k]
