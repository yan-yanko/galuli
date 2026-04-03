"""Prompt loader — reads .txt prompt templates from this directory."""
from pathlib import Path

_DIR = Path(__file__).parent


def load_prompt(name: str) -> str:
    """Load a prompt template by name (without .txt extension)."""
    path = _DIR / f"{name}.txt"
    return path.read_text(encoding="utf-8")
