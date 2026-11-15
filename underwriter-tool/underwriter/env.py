"""Minimal .env loader (KEY=VALUE lines) so the API key can live in an untracked .env file."""
import os
from pathlib import Path


def use_key_alias() -> None:
    """The team saved the Claude key under its own name; the Anthropic library expects ANTHROPIC_API_KEY."""
    if os.environ.get("ANTHROPIC_API_KEY"):
        return
    for name in ("API_INVESTD", "API_Invest_Detroit"):
        if os.environ.get(name):
            os.environ["ANTHROPIC_API_KEY"] = os.environ[name]
            return


def load_dotenv(path: Path | None = None) -> None:
    try:
        _load(path)
    finally:
        use_key_alias()


def _load(path: Path | None = None) -> None:
    p = path or Path(__file__).resolve().parents[1] / ".env"
    if not p.exists():
        return
    for line in p.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if v and k not in os.environ:
            os.environ[k] = v
