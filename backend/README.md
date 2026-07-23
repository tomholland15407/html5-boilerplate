# Trợ lý mua sắm — backend

Vietnamese shopping assistant over the Điện Máy Xanh catalog (13,754 products,
119 categories). Answers in 2–4 s on an M5 MacBook Pro with everything running
locally.

## Run

```bash
python3 -m venv .venv && ./.venv/bin/pip install fastapi uvicorn openpyxl httpx
./.venv/bin/python backend/ingest.py                 # xlsx -> data/catalog.db (~6s)
cd backend && ../.venv/bin/python -m uvicorn server:app --port 8000
```

Then open <http://localhost:8000>. First boot warms both models (~10 s); after
that the weights stay pinned (`keep_alive: -1`).

```bash
cd backend && ../.venv/bin/python test_guards.py     # regression tests
```

Requires Ollama with `qwen2.5:latest` and `llama3.2:latest`.

## The idea

**The model never touches retrieval, ranking, or numbers.** It is handed three
already-chosen rows and asked to write two sentences about them. Everything else
is deterministic code that runs in milliseconds.

```
text ─► normalise + slang      ~1 ms   dictionary, no model
     ─► intent route           ~1 ms   small talk answers here and stops
     ─► ask-or-answer policy   ~2 ms   information gain, hard cap of 3 questions
     ─► SQL filter + rank     ~30 ms   cards pushed to the browser NOW
     ─► generate            ~2–3 s     streamed, deadline-bounded
```

Measured over 38 queries: **p50 2.7 s, p90 3.5 s, max 3.7 s**, product cards on
screen at 30 ms, small talk at 2 ms.

## Files

| file | what it does |
|---|---|
| `vntext.py` | Diacritic folding, teencode, Vietnamese money (`20 củ`, `5tr5`, `10-15 triệu`), homograph disambiguation |
| `taxonomy.py` | 119 categories → 35 groups; 1,295 spec keys → 24 numeric features |
| `ingest.py` | xlsx → SQLite: FTS index, feature extraction, per-category percentiles |
| `lexicon.py` | Slang → constraints. The part that understands "pin trâu" |
| `catalog.py` | SQL retrieval, weighted ranking, relaxation ladder, variant de-duplication |
| `nlu.py` | Intent routing and query understanding — no model on this path |
| `policy.py` | Ask-or-answer decision by information gain |
| `chat.py` | Turn orchestration, prompt building, hallucination guards |
| `server.py` | FastAPI + SSE |

## Three decisions worth knowing about

**Slang thresholds are percentiles, not constants.** "Pin trâu" is not
`>= 5000 mAh`; it is "top 40 % battery *for this category*", read from the
catalog's own distribution — 6,000 mAh for a phone, 10,000 for a power bank,
resolved from `feature_stats`. One rule stays correct across every category and
survives a catalog refresh.

**Questions are capped by construction.** A model told "ask 2–3 questions" asks
six or none. Here the decision is code: never ask when the shopper has already
given two constraints, ask the highest-information-gain slot otherwise, stop at
three. `"Điện thoại pin trâu dưới 8 củ"` is answered immediately; a bare
`"laptop"` earns one budget question.

**Nothing the model writes about the catalog goes unchecked.** Every figure in a
reply must appear in the three rows it was given (`check_numbers`), and every
brand it names must be one of those shown (`check_brands`). A reply that fails is
replaced with a templated one built from the same data. Both guards fire in
practice — the model has been caught inventing a price and inventing a brand.

## Vietnamese notes

Folding is what lets `man hinh dep` match `màn hình đẹp` — most people type
without diacritics. Two traps come with it, and both are handled:

- **`đ` survives SQLite's `remove_diacritics 2`.** It is precomposed with a
  stroke and never decomposes, so an index built from raw text stores
  `đien thoai` and a folded query for `dien thoai` matches nothing. Both sides
  are folded in `ingest.py`.
- **Folding creates homographs.** `chào` (hello) → `chao` = `chảo` (frying pan);
  `nhé` (particle) → `nhe` = `nhẹ` (lightweight); `xin` → `xịn` (premium).
  `AMBIGUOUS_FORMS` in `vntext.py` requires the exact spelling when the writer
  used marks, and falls back to loose matching when they did not.

Regional variants matter too: `điều hoà` (northern) and `máy lạnh` (southern) are
the same appliance and both map to `ac`.

## Tuning

| knob | where | default |
|---|---|---|
| Generation deadline | `GEN_DEADLINE_S` | 4.5 s |
| Output cap | `MAX_TOKENS` | 120 |
| Generation model | `GEN_MODEL` | `qwen2.5:latest` |
| Max questions | `policy.MAX_QUESTIONS` | 3 |
| Answer without asking | `policy.ENOUGH_CONSTRAINTS` | 2 |
| Ranking weights | `catalog.W_*` | see file |

`llm.py` speaks the Ollama HTTP API directly, so pointing `OLLAMA_URL` at an MLX
or llama.cpp server is a config change, not a code change.
