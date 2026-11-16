"""Thin wrapper around the Anthropic SDK for document extraction.

- PDFs go in as base64 `document` blocks (Claude reads each page as text + image, so scanned statements work).
- The documents are the first, stable part of the prompt and carry `cache_control`, so the classification call and
  the per-document extraction calls reuse the cached prefix.
- Output is constrained with `output_config.format` (JSON schema derived from our Pydantic models) and then
  validated with Pydantic; one repair retry on validation failure.
- Server-side refusal fallback (`fallbacks: "default"`) is enabled; set UNDERWRITER_FALLBACKS=0 to disable.
"""
from __future__ import annotations

import base64
import copy
import json
import logging
import os
from dataclasses import dataclass, field
from typing import Optional, Type, TypeVar

from pydantic import BaseModel, ValidationError

log = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)

# Which AI service to use. A key that starts with "sk-ant" is a Claude key from Anthropic. Any other key (such as the
# University of Michigan GPT Toolkit key saved as API_INVESTD) is used with an OpenAI-style service at OPENAI_BASE_URL.
OPENAI_KEY_NAMES = ("UMGPT_API_KEY", "OPENAI_API_KEY", "API_INVESTD", "API_Invest_Detroit")
OPENAI_BASE_URL = os.environ.get("UNDERWRITER_OPENAI_BASE_URL", "https://api.toolkit.umgpt.umich.edu/v1").rstrip("/")


def _clean(v: Optional[str]) -> str:
    return (v or "").strip()


def openai_key() -> str:
    for n in OPENAI_KEY_NAMES:
        if _clean(os.environ.get(n)) and not _clean(os.environ.get(n)).startswith("sk-ant"):
            return _clean(os.environ[n])
    return ""


def anthropic_key() -> str:
    k = _clean(os.environ.get("ANTHROPIC_API_KEY"))
    if k:
        return k
    for n in OPENAI_KEY_NAMES:           # a Claude key saved under one of the team's own names
        if _clean(os.environ.get(n)).startswith("sk-ant"):
            return _clean(os.environ[n])
    return ""


def provider() -> Optional[str]:
    """'anthropic', 'openai', or None when no key is set."""
    if anthropic_key() or _clean(os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        return "anthropic"
    if openai_key():
        return "openai"
    return None


DEFAULT_MODEL = os.environ.get("UNDERWRITER_MODEL") or ("gpt-5.6-terra" if provider() == "openai" else "claude-opus-5-5")
DEFAULT_EFFORT = os.environ.get("UNDERWRITER_EFFORT", "high")
USE_FALLBACKS = os.environ.get("UNDERWRITER_FALLBACKS", "1") != "0"


class LLMUnavailable(RuntimeError):
    pass


@dataclass
class DocInput:
    name: str
    data: bytes
    media_type: str = "application/pdf"


@dataclass
class Usage:
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_input_tokens: int = 0
    cache_creation_input_tokens: int = 0
    calls: int = 0
    log: list[str] = field(default_factory=list)

    def add(self, u, label: str):
        if u is None:
            return
        self.calls += 1
        for k in ("input_tokens", "output_tokens", "cache_read_input_tokens", "cache_creation_input_tokens"):
            setattr(self, k, getattr(self, k) + (getattr(u, k, 0) or 0))
        self.log.append(f"{label}: in={getattr(u, 'input_tokens', 0)} out={getattr(u, 'output_tokens', 0)} "
                        f"cache_read={getattr(u, 'cache_read_input_tokens', 0) or 0}")


def strict_json_schema(model: Type[BaseModel]) -> dict:
    """Pydantic JSON schema -> structured-output friendly schema (all properties required, no extras, no defaults)."""
    schema = copy.deepcopy(model.model_json_schema())

    def walk(node):
        if isinstance(node, dict):
            if not isinstance(node.get("default"), dict):
                node.pop("default", None)
            if isinstance(node.get("title"), str):   # metadata only; never a property literally named "title"
                node.pop("title", None)
            if node.get("type") == "object" and "properties" in node:
                node["additionalProperties"] = False
                node["required"] = list(node["properties"].keys())
            for v in list(node.values()):
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    walk(schema)
    return schema


def api_available() -> bool:
    return provider() is not None


class ClaudeExtractor:
    def __init__(self, client=None, model: str = DEFAULT_MODEL, effort: str = DEFAULT_EFFORT):
        if client is None:
            if not api_available():
                raise LLMUnavailable("No API key is set. Set it in .env (see .env.example) or load a saved extraction.")
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key() or None)
        self.client = client
        self.model = model
        self.effort = effort
        self.usage = Usage()

    def _content(self, docs: list[DocInput], instruction: str) -> list[dict]:
        blocks: list[dict] = []
        for i, d in enumerate(docs):
            blocks.append({"type": "text", "text": f"Document {i + 1}: {d.name}"})
            blocks.append({"type": "document", "title": d.name,
                           "source": {"type": "base64", "media_type": d.media_type,
                                      "data": base64.standard_b64encode(d.data).decode("ascii")}})
        if blocks:
            blocks[-1]["cache_control"] = {"type": "ephemeral"}
        blocks.append({"type": "text", "text": instruction})
        return blocks

    def _request(self, system: str, content: list[dict], schema: dict, max_tokens: int):
        kwargs = dict(model=self.model, max_tokens=max_tokens, system=system,
                      messages=[{"role": "user", "content": content}],
                      output_config={"effort": self.effort, "format": {"type": "json_schema", "schema": schema}})
        if USE_FALLBACKS:
            kwargs.update(betas=["server-side-fallback-2026-07-01"], fallbacks="default")
        try:
            with self.client.beta.messages.stream(**kwargs) as stream:
                return stream.get_final_message()
        except Exception as e:  # noqa: BLE001 - retry once without the fallback beta if the API rejects it
            import anthropic
            if USE_FALLBACKS and isinstance(e, anthropic.BadRequestError) and "fallback" in str(e).lower():
                kwargs.pop("betas", None)
                kwargs.pop("fallbacks", None)
                with self.client.beta.messages.stream(**kwargs) as stream:
                    return stream.get_final_message()
            raise

    def extract(self, docs: list[DocInput], system: str, instruction: str, out_model: Type[T],
                label: str, max_tokens: int = 64000) -> T:
        schema = strict_json_schema(out_model)
        content = self._content(docs, instruction)
        msg = self._request(system, content, schema, max_tokens)
        self.usage.add(getattr(msg, "usage", None), label)
        if getattr(msg, "stop_reason", None) == "refusal":
            raise RuntimeError(f"{label}: the model declined the request ({getattr(msg, 'stop_details', None)}).")
        if getattr(msg, "stop_reason", None) == "max_tokens":
            raise RuntimeError(f"{label}: output hit max_tokens; split the document or raise max_tokens.")
        text = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text")
        try:
            return out_model.model_validate_json(text)
        except ValidationError as err:
            log.warning("%s: validation failed, retrying once: %s", label, err)
            repair = content + [{"type": "text", "text": "Your previous JSON failed validation with these errors:\n"
                                 f"{err}\nReturn corrected JSON only."}]
            msg = self._request(system, repair, schema, max_tokens)
            self.usage.add(getattr(msg, "usage", None), label + " (repair)")
            text = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text")
            return out_model.model_validate_json(text)



# ----------------------------------------------------------------------------------------------------------------
# OpenAI-style service (the University of Michigan GPT Toolkit)
# ----------------------------------------------------------------------------------------------------------------
MAX_IMAGE_PAGES = 20          # scanned pages sent as pictures per document


def _pdf_parts(d: DocInput) -> list[dict]:
    """Turn a PDF into text parts (its text layer) and, for scanned pages with no text, page pictures."""
    import io
    from pypdf import PdfReader

    parts: list[dict] = []
    reader = PdfReader(io.BytesIO(d.data))
    if reader.is_encrypted:
        reader.decrypt("")
    scanned: list[int] = []
    for i, page in enumerate(reader.pages):
        try:
            text = (page.extract_text() or "").strip()
        except Exception:  # noqa: BLE001
            text = ""
        if len(text) > 50:
            parts.append({"type": "text", "text": f"[{d.name}, page {i + 1}]\n{text}"})
        else:
            scanned.append(i)
    if scanned:
        try:
            import pypdfium2 as pdfium
            pdf = pdfium.PdfDocument(d.data)
            for i in scanned[:MAX_IMAGE_PAGES]:
                img = pdf[i].render(scale=1.5).to_pil().convert("RGB")
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=70)
                b64 = base64.standard_b64encode(buf.getvalue()).decode("ascii")
                parts.append({"type": "text", "text": f"[{d.name}, page {i + 1} (scanned)]"})
                parts.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}})
        except Exception as e:  # noqa: BLE001
            log.warning("%s: could not render scanned pages: %s", d.name, e)
    return parts


class OpenAIExtractor:
    """Same job as ClaudeExtractor, but through an OpenAI-style chat service (base URL + key from the environment)."""

    def __init__(self, client=None, model: str = DEFAULT_MODEL, effort: str = DEFAULT_EFFORT):
        if client is None:
            key = openai_key()
            if not key:
                raise LLMUnavailable("No API key is set. Set it in .env (see .env.example) or load a saved extraction.")
            from openai import OpenAI
            client = OpenAI(api_key=key, base_url=OPENAI_BASE_URL, timeout=600)
        self.client = client
        self.model = model
        self.effort = effort
        self.usage = Usage()

    def _content(self, docs: list[DocInput], instruction: str) -> list[dict]:
        parts: list[dict] = []
        for i, d in enumerate(docs):
            parts.append({"type": "text", "text": f"Document {i + 1}: {d.name}"})
            parts.extend(_pdf_parts(d))
        parts.append({"type": "text", "text": instruction})
        return parts

    def _request(self, system: str, content: list[dict], schema: dict, max_tokens: int):
        schema_note = "\n\nReturn only JSON that matches this JSON schema:\n" + json.dumps(schema)
        kwargs = dict(model=self.model, max_completion_tokens=min(max_tokens, 32000),
                      messages=[{"role": "system", "content": system + schema_note},
                                {"role": "user", "content": content}])
        try:
            return self.client.chat.completions.create(
                **kwargs, response_format={"type": "json_schema",
                                           "json_schema": {"name": "result", "strict": True, "schema": schema}})
        except Exception as e:  # noqa: BLE001 - some gateways do not support strict schemas; ask for plain JSON instead
            import openai
            if isinstance(e, openai.BadRequestError) and "response_format" in str(e).lower():
                return self.client.chat.completions.create(**kwargs, response_format={"type": "json_object"})
            raise

    def _text(self, resp, label: str) -> str:
        u = getattr(resp, "usage", None)
        if u is not None:
            from types import SimpleNamespace
            self.usage.add(SimpleNamespace(input_tokens=getattr(u, "prompt_tokens", 0),
                                           output_tokens=getattr(u, "completion_tokens", 0)), label)
        choice = resp.choices[0]
        if getattr(choice, "finish_reason", None) == "length":
            raise RuntimeError(f"{label}: output hit the length limit; split the document or raise max_tokens.")
        return choice.message.content or ""

    def extract(self, docs: list[DocInput], system: str, instruction: str, out_model: Type[T],
                label: str, max_tokens: int = 64000) -> T:
        schema = strict_json_schema(out_model)
        content = self._content(docs, instruction)
        text = self._text(self._request(system, content, schema, max_tokens), label)
        try:
            return out_model.model_validate_json(text)
        except ValidationError as err:
            log.warning("%s: validation failed, retrying once: %s", label, err)
            repair = content + [{"type": "text", "text": "Your previous JSON failed validation with these errors:\n"
                                 f"{err}\nReturn corrected JSON only."}]
            text = self._text(self._request(system, repair, schema, max_tokens), label + " (repair)")
            return out_model.model_validate_json(text)


def make_extractor(client=None):
    """The right extractor for the key that is set. A supplied test client is always treated as a Claude client."""
    if client is None and provider() == "openai":
        return OpenAIExtractor()
    return ClaudeExtractor(client=client)
