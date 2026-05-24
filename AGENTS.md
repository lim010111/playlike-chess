# chess_transformer

## Project documentation

- [`CONTEXT-MAP.md`](./CONTEXT-MAP.md) — multi-context entry point. Three contexts: Training, Engine, Web. Each has its own `CONTEXT.md` under `src/<context>/`.
- [`docs/adr/`](./docs/adr/) — accumulated architecture decisions:
  - `0001` — Transformer over FEN tokens with a fixed action-space policy head.
  - `0002` — Split data sources (Lichess for Base, Chess.com for per-Player).
  - `0003` — Closed Roster with dev-time Adapter training.
  - `0004` — Project name (Playlike Chess; `Engine` reserved for the runtime module).
- [`docs/agents/`](./docs/agents/) — agent workflow guides:
  - [`domain.md`](./docs/agents/domain.md) — how skills should consume `CONTEXT.md` / `docs/adr/` when exploring.
  - [`issue-tracker.md`](./docs/agents/issue-tracker.md) — issues as markdown under `.scratch/<feature>/`.
  - [`triage-labels.md`](./docs/agents/triage-labels.md) — five canonical triage roles.

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, using the default label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.
