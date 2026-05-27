# Random-move tracer bullet

Status: ready-for-agent

## Parent

`.scratch/playlike-chess/PRD.md`

## What to build

A complete vertical tracer through the entire web stack — React board ↔ FastAPI backend ↔ python-chess — where the engine simply picks a random legal Move from the current Position. No ML, no model loading, no Adapter switching, no Stockfish. The point is to validate that the React + `react-chessboard` + `chess.js` + FastAPI + python-chess stack composes correctly, that the API contract works, and that an end user can play a complete Session in the browser before any ML work begins. ("Session" = one complete live play instance in a browser tab from start to a Terminal state — see `src/web/CONTEXT.md`.)

The slice exists primarily to de-risk the plumbing. Subsequent slices replace the random-move backend with real ML inference, but the surrounding infrastructure (web server, board UI, API contract, Terminal-state handling) stays.

## How to slice this work

This issue intentionally stays a single file (renumbering all downstream issues to support a split is more churn than it's worth), but the acceptance criteria are grouped into three phases. Each phase is intended to ship as its own PR so the merge-gate runs three times — that is the primary reason for the grouping, since this is the first issue exercising the merge-gate end to end.

- **Phase 1 (PR 1)** — Backend + CI. The server stands up and a backend test passes in CI.
- **Phase 2 (PR 2)** — Frontend skeleton. The board renders, drag/drop wires through to `/move`, and the session can be played until `chess.js` reports game-over (board simply freezes; no Terminal-state UI yet).
- **Phase 3 (PR 3)** — Session lifecycle. The five Terminal states dispatch into the UI, a new-Session button works, and a SAN move list is visible. After Phase 3 the original tracer-bullet intent is met.

Phases must be merged in order — Phase 2 has no backend without Phase 1, Phase 3 has no frontend without Phase 2.

## Acceptance criteria

### Phase 1 — Backend + CI (PR 1)

- [x] FastAPI server exposes `POST /move` accepting `{ fen: string }` and returning `{ move_uci: string }`
- [x] Backend uses `python-chess` `board.legal_moves` and returns a uniformly random selection
- [x] Backend CI workflow runs on every PR and always reports a status check (so the check is safe to set as a required branch-protection rule). Engine-relevant steps — lint, typecheck, test — are path-filtered inside the job on `src/engine/**` so they only execute when engine files change. (This phase introduces the first `pyproject.toml` and the backend CI workflow.)

### Phase 2 — Frontend skeleton (PR 2)

- [x] React frontend renders the starting Position via `react-chessboard`
- [x] User can drag pieces; `chess.js` prevents illegal drops on the client
- [x] On a user Move, frontend POSTs the resulting FEN to `/move` and applies the engine's response. On pawn promotion the user is presented with a piece picker (queen/rook/bishop/knight) — auto-queen is not acceptable. `react-chessboard` v5 removed its built-in promotion dialog (it was a v4-only API), so the picker ships as a small custom overlay rendered by the frontend; the AC contract is "picker shown, chosen piece applied", not a specific library API path. While the picker is open, the input lock (no piece drags accepted) remains in effect; if the user cancels or dismisses the picker, the pending user move is rolled back in `chess.js` (board returns to pre-drop state) and no `/move` POST is issued. Engine-side promotion is handled implicitly because `board.legal_moves` enumerates promotion variants and `move.uci()` carries the promotion piece (e.g. `"e7e8q"`), which the frontend's UCI parser passes to `chess.move({ from, to, promotion })`.
- [x] When `chess.js` reports `isGameOver()`, the board freezes and stops accepting input (5-way Terminal-state dispatch and UI labelling are deferred to Phase 3)
- [x] Frontend CI workflow runs on every PR and always reports a status check (so the check is safe to set as a required branch-protection rule). Web-relevant steps — lint, typecheck, test, build — are path-filtered inside the job on `src/web/**` so they only execute when web files change. (This phase introduces the first `package.json` and the frontend CI workflow; no automated UI tests — per PRD, Playwright is a v2 candidate.)
- [x] At least one meaningful unit test of non-UI logic ships with this phase, mirroring the engine's day-one test pattern (`api_test.py`, `random_move_test.py`). Concrete minimum: (a) a test of the `/move` API client function (e.g. `apiClient_test.ts`) covering the 200 happy path and the 422 error mapping with mocked `fetch`; (b) a test of the session-state abstraction's `humanColor='white'` initialization path (user moves first) — Phase 2's hook signature accepts `humanColor: 'white' | 'black'` but the `'black'` branch MUST throw in Phase 2 because the engine-moves-first lifecycle is not implemented yet; the actual `'black'` initialization (engine selfstart via mount effect + board orientation flip) is deferred to Phase 3 / issue #05 together with the color-selection UI, so they ship as one coherent unit; (c) a **hook-level** test of the user-pawn-promotion path (NOT a `react-chessboard` DOM/component test — React UI tests are out of scope for v1 per PRD line 145): with a pre-promotion fixture position, drive the hook's promotion-resolution interface programmatically with a chosen piece and assert chess.js applies the chosen piece and the FEN POSTed to `/move` reflects it. Vitest runs without `--passWithNoTests`, so this AC also guards against future test removal.

### Phase 3 — Session lifecycle (PR 3)

- [x] `useChessSession` exposes a `terminal: TerminalState | null` field that replaces the Phase-2 `isGameOver` boolean (or makes `isGameOver` a derived `terminal !== null` if kept for migration). `TerminalState` is a TypeScript discriminated union with kinds `checkmate` (carrying `winner: 'white' | 'black'`), `stalemate`, `threefold-repetition`, `fifty-move-rule`, and `insufficient-material`. The UI dispatches on `terminal.kind` — this realises the "enum-shaped concept the UI dispatches on" called out in `src/web/CONTEXT.md`.
- [x] After every move (user move commit AND engine reply), the hook detects the Terminal state in this exact predicate order: (1) `chess.isCheckmate()` with `winner = chess.turn() === 'w' ? 'black' : 'white'` (side that just moved); (2) `chess.isStalemate()`; (3) `chess.isThreefoldRepetition()`; (4) `chess.isInsufficientMaterial()`; (5) `chess.isDraw()` as fallback → label `fifty-move-rule`. Ordering matters because `chess.js` `isDraw()` is true for stalemate / threefold / insufficient-material too; specific predicates are checked first so each terminal is labelled correctly. `chess.js` has no dedicated "fifty-move-only" predicate in v1, so the residual `isDraw()` is the documented fallback path.
- [x] When `terminal !== null`, an inline banner is rendered below the board with one of the six exact labels: `"Checkmate. White wins."`, `"Checkmate. Black wins."`, `"Draw — stalemate"`, `"Draw — threefold repetition"`, `"Draw — 50-move rule"`, `"Draw — insufficient material"`. The banner is the host element for the New Session button (no separate banner / button surfaces in v1).
- [x] `useChessSession` exposes `resetSession(): void` that bumps `requestIdRef` (so any `/move` response still in flight from the prior Session is silently dropped on arrival via the existing stale-id guard), reinitialises `chessRef` to a fresh `new Chess()`, and clears every state slice — `fen` to the starting position, `history` to `[]`, `terminal` to `null`, `pendingPromotion` to `null`, `error` to `null`, `awaiting` to `false`.
- [x] The New Session button is visible **only while `terminal !== null`** (i.e. inside the Terminal banner; the button does not surface mid-Session — User Story #12 only requires "start a new game", and exposing reset mid-flight invites accidental-click loss). `onClick` calls `session.resetSession()`. After reset the user can immediately play a fresh Session in the same browser tab without any page reload.
- [x] A SAN move list is rendered below the board (and below the Terminal banner when present) in the standard `N. white black` paired format (e.g. `"1. e4 e5"`, `"2. Nf3 Nc6"`). When white has moved but black has not yet replied, the trailing half-move is shown alone (e.g. `"3. Bb5"`). Source data is `session.history`, which already carries `{ uci, san }` from Phase 2. The list remains visible after termination so the user can review the completed Session.
- [x] The SAN pairing logic lives in a pure helper (e.g. `app/moveList.ts` exporting `pairSanHistory(history: HistoryEntry[]): string[]`) and ships with a co-located unit test (e.g. `moveList_test.ts`) covering at minimum: empty history → `[]`; one half-move → `["1. e4"]`; two half-moves → `["1. e4 e5"]`; odd-length 3 → `["1. e4 e5", "2. Nf3"]`. (Mirrors Phase 2's "no `--passWithNoTests`" convention.)
- [x] `useChessSession_test.ts` adds one hook-level test per Terminal kind (5 total — checkmate, stalemate, threefold-repetition, fifty-move-rule, insufficient-material) using pre-terminal FEN fixtures: drive the hook into the terminal state (via `onPieceDrop` for the final user move, or a mocked engine reply that mates/draws), then assert `terminal` deep-equals the expected discriminant (including `winner` for checkmate). The 50-move-rule fixture starts with halfmove clock at 99 so a single non-capture, non-pawn move triggers it.
- [x] `useChessSession_test.ts` adds one test for `resetSession()`: drive through a partial Session (≥ 1 user move + mocked engine reply), call `resetSession()`, and assert every field is reset to its initial value — `fen` to the starting position, `history === []`, `terminal === null`, `pendingPromotion === null`, `error === null`, `awaiting === false`.
- [x] `humanColor='black'` continues to throw in `useChessSession`. The engine-moves-first lifecycle + board-orientation flip + color-selection UI remain deferred to issue #05 as Phase 2 established; the existing throw test stays green.
- [x] Before requesting review, manually smoke-test the full lifecycle via the two-terminal dev path in `src/web/AGENTS.md`: start the engine (`uv run uvicorn playlike_engine.api:app --reload`) and the frontend (`pnpm dev`), play one random-vs-random Session to any Terminal state, click New Session, play another Session. Record the observed Terminal state(s) in the PR description. (Automated end-to-end checks for "any reachable terminal" are impractical with random moves; the 5 fixture tests are the structural guarantee and the smoke is the integration guarantee.)

## Blocked by

None — can start immediately.
