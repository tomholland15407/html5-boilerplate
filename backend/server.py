"""HTTP surface: one streaming chat endpoint plus static hosting.

The latency trick lives here. Retrieval finishes in ~10 ms, so the three product
cards are pushed to the browser *before* the model starts writing. The shopper
sees real results almost immediately and the prose fills in around them, which
makes a four-second answer feel like a half-second one.

A hard deadline wraps generation. If the model is slow the stream closes with a
templated reply built from the same rows — the customer never watches a spinner
past the budget.

    uvicorn server:app --port 8000        (from backend/)
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

sys.path.insert(0, str(Path(__file__).resolve().parent))

from catalog import Catalog                                     # noqa: E402
from chat import (ChatEngine, build_prompt, check_brands,        # noqa: E402
                  check_numbers, render_fallback, SYSTEM_PROMPT,
                  trim_to_sentence)
from llm import LLM                                              # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = os.environ.get("CATALOG_DB", str(ROOT / "data" / "catalog.db"))
FRONTEND = ROOT / "dist"

# Wall-clock ceiling for the model's part of a turn. Retrieval and routing cost
# ~10ms, so this is effectively the whole budget with room to spare.
GEN_DEADLINE_S = float(os.environ.get("GEN_DEADLINE_S", "4.5"))
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "120"))

state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not Path(DB_PATH).exists():
        raise RuntimeError(
            f"catalog not found at {DB_PATH} — run: python backend/ingest.py")
    cat = Catalog(DB_PATH)
    llm = LLM()
    state["engine"] = ChatEngine(cat, llm)
    state["llm"] = llm
    state["catalog"] = cat

    n = cat.con.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    print(f"catalog ready: {n:,} products")
    # Pay the cold-load cost now rather than on the first customer question.
    print("warming models ...", flush=True)
    print("  ", await llm.warmup())
    yield
    await llm.aclose()
    cat.close()


app = FastAPI(title="Trợ lý mua sắm", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.get("/api/health")
async def health() -> JSONResponse:
    cat = state["catalog"]
    return JSONResponse({
        "ok": True,
        "products": cat.con.execute("SELECT COUNT(*) FROM products").fetchone()[0],
        "models": await state["llm"].available(),
    })


@app.post("/api/reset")
async def reset(req: Request) -> JSONResponse:
    body = await req.json()
    state["engine"].reset(body.get("session_id", ""))
    return JSONResponse({"ok": True})


@app.post("/api/chat")
async def chat(req: Request) -> StreamingResponse:
    body = await req.json()
    text: str = (body.get("message") or "").strip()
    sid: str = body.get("session_id") or uuid.uuid4().hex
    engine: ChatEngine = state["engine"]
    llm: LLM = state["llm"]

    async def gen() -> AsyncIterator[str]:
        t0 = time.perf_counter()
        yield sse("meta", {"session_id": sid})

        if not text:
            yield sse("token", {"text": "Bạn nhắn gì đó để mình hỗ trợ nhé!"})
            yield sse("done", {"ms": 0})
            return

        # Routing, understanding and the ask/answer decision — all local.
        loop = asyncio.get_running_loop()
        session, u, early = await loop.run_in_executor(
            None, engine.prepare, sid, text)
        t_understand = time.perf_counter() - t0

        if early is not None:
            yield sse("token", {"text": early.text})
            if early.chips:
                yield sse("chips", {"chips": early.chips})
            yield sse("done", {"kind": early.kind, "ms": round(t_understand * 1000),
                               "debug": early.debug})
            return

        # Retrieve, then push the cards straight away.
        res = await loop.run_in_executor(None, engine.retrieve, u)
        t_search = time.perf_counter() - t0
        session.last_products = res.products

        yield sse("products", {
            "products": [p.as_dict() for p in res.products],
            "total_matched": res.total_matched,
            "notes": engine.notes(u, res),
        })

        if not res.products:
            msg = render_fallback(u, res)
            yield sse("token", {"text": msg})
            yield sse("done", {"kind": "empty",
                               "ms": round((time.perf_counter() - t0) * 1000)})
            return

        # Generate the framing sentence, streamed.
        prompt = build_prompt(u, res)
        budget = GEN_DEADLINE_S - (time.perf_counter() - t0)
        pieces: list[str] = []
        try:
            async for chunk in llm.stream(prompt, SYSTEM_PROMPT,
                                          max_tokens=MAX_TOKENS,
                                          temperature=0.4,
                                          deadline_s=max(budget, 0.5)):
                pieces.append(chunk)
                yield sse("token", {"text": chunk})
        except Exception:  # noqa: BLE001 - never surface a stack trace mid-chat
            pieces = []

        raw_reply = "".join(pieces).strip()
        reply = trim_to_sentence(raw_reply)
        if reply != raw_reply:
            # Deadline landed mid-clause; re-render the trimmed version.
            yield sse("replace", {"text": reply, "reason": "trimmed"})

        bad = check_numbers(reply, res.products, u.text) if reply else ["<empty>"]
        bad += check_brands(reply, res.products,
                            engine.understander.brands.keys(), u.text)
        if bad:
            # Either the model timed out, or it wrote a figure that is not in
            # the rows it was given. Replace the whole turn with the templated
            # answer rather than leave an invented price on screen.
            fallback = render_fallback(u, res)
            yield sse("replace", {"text": fallback, "reason": "unverified_numbers",
                                  "offending": bad[:5]})
            reply = fallback

        total_ms = (time.perf_counter() - t0) * 1000
        yield sse("done", {
            "kind": "recommend",
            "ms": round(total_ms),
            "timing": {
                "understand_ms": round(t_understand * 1000),
                "search_ms": round((t_search - t_understand) * 1000),
                "generate_ms": round(total_ms - t_search * 1000),
                "gen_tokens": llm.last.gen_tokens,
                "prefill_s": round(llm.last.prefill_s, 3),
            },
            "matched": res.total_matched,
            "slang": u.slang_labels,
            "relaxed": res.relaxed,
            "guard": {"tripped": bool(bad), "offending": bad[:5]},
        })

    return StreamingResponse(gen(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache", "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    })


if FRONTEND.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND), html=True), name="static")


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(str(FRONTEND / "index.html"))
