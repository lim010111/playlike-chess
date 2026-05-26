# AGENTS.md

Canonical agent guidance for this project. Claude Code reads this via the
`@AGENTS.md` import in `CLAUDE.md`; Codex CLI and antigravity CLI pick it up
directly. Edit this file — not `CLAUDE.md`.

## Local dev — running the frontend

Single-package pnpm layout (no workspace). From this directory:

```
pnpm install
pnpm dev
```

Vite serves on `http://localhost:5173` and proxies `/move` to
`http://localhost:8000` (see `vite.config.ts`), so the engine must be running
locally — see `src/engine/AGENTS.md` for the uvicorn command. Run engine and
frontend in two separate terminals; there is no orchestrator.

Node version is pinned in `.nvmrc` (24 LTS) and the `engines` field in
`package.json`. pnpm version is pinned via `packageManager` and enforced by
Corepack.

## Scripts

- `pnpm dev` — start the Vite dev server
- `pnpm build` — production build to `dist/`
- `pnpm preview` — serve the production build locally
- `pnpm test` — Vitest in run mode (CI uses this)
- `pnpm test:watch` — Vitest in watch mode
- `pnpm lint` — Biome check (lint + format)
- `pnpm format` — Biome format (writes)
- `pnpm typecheck` — `tsc --noEmit` against the strict app + node configs

## Layout

`app/` is the React source root (mirrors `src/engine/playlike_engine/` — a
per-context package, not the Vite default `src/`). Tests are co-located with
the module they cover and named `<module>_test.ts(x)`. See
`src/web/CONTEXT.md` for domain vocabulary (Session, Opponent, Terminal state).
