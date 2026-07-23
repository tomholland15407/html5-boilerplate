"""Ollama client.

Deliberately thin. The interesting decisions are elsewhere; what matters here is
that generation never blocks past its deadline and that the model is warm before
the first customer ever types.

Speaks the Ollama HTTP API directly, so swapping in an MLX or llama.cpp server
means changing a base URL and nothing else.
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from collections.abc import AsyncIterator
from dataclasses import dataclass

import httpx

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")

# Qwen2.5 7B carries noticeably better Vietnamese than Llama 3.2 3B, and in
# practice also finishes sooner: it answers in ~60 tokens where Llama rambles to
# the token cap and gets truncated mid-sentence. Terser model, faster wall clock.
GEN_MODEL = os.environ.get("GEN_MODEL", "qwen2.5:latest")
# Small talk needs no catalog reasoning, so it goes to the 3B at ~55 tok/s.
FAST_MODEL = os.environ.get("FAST_MODEL", "llama3.2:latest")

# Hard ceiling on a single generation. The caller degrades to a templated reply
# rather than letting a customer watch a spinner past the latency budget.
GEN_TIMEOUT_S = float(os.environ.get("GEN_TIMEOUT_S", "12"))


@dataclass
class Timing:
    prompt_tokens: int = 0
    gen_tokens: int = 0
    prefill_s: float = 0.0
    gen_s: float = 0.0
    wall_s: float = 0.0


class LLM:
    def __init__(self, base_url: str = OLLAMA_URL):
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(GEN_TIMEOUT_S + 5))
        self.last: Timing = Timing()

    async def aclose(self) -> None:
        await self._client.aclose()

    def _payload(self, model: str, prompt: str, system: str, *,
                 max_tokens: int, temperature: float, json_mode: bool,
                 stream: bool) -> dict:
        return {
            "model": model,
            "prompt": prompt,
            "system": system,
            "stream": stream,
            # keep_alive -1 pins the weights in memory. Without it Ollama
            # evicts after five idle minutes and the next request pays a
            # ~2s cold load — which is exactly when a demo gets its first
            # question.
            "keep_alive": -1,
            **({"format": "json"} if json_mode else {}),
            "options": {
                "num_predict": max_tokens,
                "temperature": temperature,
                "top_p": 0.9,
                "repeat_penalty": 1.05,
            },
        }

    async def generate(self, prompt: str, system: str = "", *, model: str | None = None,
                       max_tokens: int = 256, temperature: float = 0.4,
                       json_mode: bool = False, timeout: float | None = None) -> str:
        """One-shot generation. Returns '' if the deadline passes."""
        t0 = time.perf_counter()
        body = self._payload(model or GEN_MODEL, prompt, system,
                             max_tokens=max_tokens, temperature=temperature,
                             json_mode=json_mode, stream=False)
        try:
            r = await asyncio.wait_for(
                self._client.post(f"{self.base_url}/api/generate", json=body),
                timeout=timeout or GEN_TIMEOUT_S)
            r.raise_for_status()
            d = r.json()
        except (asyncio.TimeoutError, httpx.HTTPError):
            return ""
        self.last = Timing(
            prompt_tokens=d.get("prompt_eval_count", 0),
            gen_tokens=d.get("eval_count", 0),
            prefill_s=d.get("prompt_eval_duration", 0) / 1e9,
            gen_s=d.get("eval_duration", 0) / 1e9,
            wall_s=time.perf_counter() - t0,
        )
        return (d.get("response") or "").strip()

    async def stream(self, prompt: str, system: str = "", *, model: str | None = None,
                     max_tokens: int = 256, temperature: float = 0.4,
                     deadline_s: float | None = None) -> AsyncIterator[str]:
        """Yield text chunks as they are produced.

        Stops cleanly at the deadline instead of raising, so a slow generation
        degrades into a shorter answer rather than an error page. Whatever was
        already streamed stays on screen.
        """
        t0 = time.perf_counter()
        limit = deadline_s or GEN_TIMEOUT_S
        body = self._payload(model or GEN_MODEL, prompt, system,
                             max_tokens=max_tokens, temperature=temperature,
                             json_mode=False, stream=True)
        try:
            async with self._client.stream(
                "POST", f"{self.base_url}/api/generate", json=body
            ) as r:
                r.raise_for_status()
                async for line in r.aiter_lines():
                    if not line:
                        continue
                    if time.perf_counter() - t0 > limit:
                        break
                    try:
                        d = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    chunk = d.get("response") or ""
                    if chunk:
                        yield chunk
                    if d.get("done"):
                        self.last = Timing(
                            prompt_tokens=d.get("prompt_eval_count", 0),
                            gen_tokens=d.get("eval_count", 0),
                            prefill_s=d.get("prompt_eval_duration", 0) / 1e9,
                            gen_s=d.get("eval_duration", 0) / 1e9,
                            wall_s=time.perf_counter() - t0,
                        )
                        break
        except (httpx.HTTPError, asyncio.TimeoutError):
            return

    async def warmup(self, models: tuple[str, ...] = (GEN_MODEL, FAST_MODEL)) -> dict:
        """Load weights and prime the prompt cache before real traffic.

        A cold 7B costs about two seconds of disk I/O. Paying it at boot rather
        than on the first customer question is the single cheapest latency win
        available.
        """
        out = {}
        for m in models:
            t0 = time.perf_counter()
            try:
                await self.generate("ok", "Trả lời ngắn.", model=m,
                                    max_tokens=1, timeout=120)
                out[m] = round(time.perf_counter() - t0, 2)
            except Exception as e:  # noqa: BLE001 - report, never block startup
                out[m] = f"failed: {e}"
        return out

    async def available(self) -> list[str]:
        try:
            r = await self._client.get(f"{self.base_url}/api/tags", timeout=5)
            r.raise_for_status()
            return [m["name"] for m in r.json().get("models", [])]
        except httpx.HTTPError:
            return []
