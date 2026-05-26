# AGENTS.md

Canonical agent guidance for this project. Claude Code reads this via the
`@AGENTS.md` import in `CLAUDE.md`; Codex CLI and antigravity CLI pick it up
directly. Edit this file — not `CLAUDE.md`.

## Local dev — running the engine

The engine is a FastAPI app served by uvicorn. From this directory:

```
uv run uvicorn playlike_engine.api:app --reload
```

That binds to `http://localhost:8000`. `POST /move` accepts `{"fen": "..."}`
and returns `{"move_uci": "..."}` — see `playlike_engine/api.py` for the
strict schema (Pydantic `extra="forbid"`).

The frontend (see `src/web/AGENTS.md`) reaches the engine via the Vite dev
proxy, so the engine deliberately does **not** mount CORS middleware in v1.
Run the engine and the frontend in two separate terminals.

## Tests

`uv run pytest` from this directory. Tests are co-located with sources
(`api_test.py`, `random_move_test.py`).
