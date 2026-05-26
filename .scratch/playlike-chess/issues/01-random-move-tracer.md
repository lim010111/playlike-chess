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

- [ ] React frontend renders the starting Position via `react-chessboard`
- [ ] User can drag pieces; `chess.js` prevents illegal drops on the client
- [ ] On a user Move, frontend POSTs the resulting FEN to `/move` and applies the engine's response. On pawn promotion the user is presented with a piece picker (queen/rook/bishop/knight) — auto-queen is not acceptable. `react-chessboard` v5 removed its built-in promotion dialog (it was a v4-only API), so the picker ships as a small custom overlay rendered by the frontend; the AC contract is "picker shown, chosen piece applied", not a specific library API path. While the picker is open, the input lock (no piece drags accepted) remains in effect; if the user cancels or dismisses the picker, the pending user move is rolled back in `chess.js` (board returns to pre-drop state) and no `/move` POST is issued. Engine-side promotion is handled implicitly because `board.legal_moves` enumerates promotion variants and `move.uci()` carries the promotion piece (e.g. `"e7e8q"`), which the frontend's UCI parser passes to `chess.move({ from, to, promotion })`.
- [ ] When `chess.js` reports `isGameOver()`, the board freezes and stops accepting input (5-way Terminal-state dispatch and UI labelling are deferred to Phase 3)
- [ ] Frontend CI workflow runs on every PR and always reports a status check (so the check is safe to set as a required branch-protection rule). Web-relevant steps — lint, typecheck, test, build — are path-filtered inside the job on `src/web/**` so they only execute when web files change. (This phase introduces the first `package.json` and the frontend CI workflow; no automated UI tests — per PRD, Playwright is a v2 candidate.)
- [ ] At least one meaningful unit test of non-UI logic ships with this phase, mirroring the engine's day-one test pattern (`api_test.py`, `random_move_test.py`). Concrete minimum: (a) a test of the `/move` API client function (e.g. `apiClient_test.ts`) covering the 200 happy path and the 422 error mapping with mocked `fetch`; (b) a test of the session-state abstraction's `humanColor='white'` initialization path (user moves first) — Phase 2's hook signature accepts `humanColor: 'white' | 'black'` but the `'black'` branch MUST throw in Phase 2 because the engine-moves-first lifecycle is not implemented yet; the actual `'black'` initialization (engine selfstart via mount effect + board orientation flip) is deferred to Phase 3 / issue #05 together with the color-selection UI, so they ship as one coherent unit; (c) a **hook-level** test of the user-pawn-promotion path (NOT a `react-chessboard` DOM/component test — React UI tests are out of scope for v1 per PRD line 145): with a pre-promotion fixture position, drive the hook's promotion-resolution interface programmatically with a chosen piece and assert chess.js applies the chosen piece and the FEN POSTed to `/move` reflects it. Vitest runs without `--passWithNoTests`, so this AC also guards against future test removal.

### Phase 3 — Session lifecycle (PR 3)

- [ ] Session terminates correctly on each of the five Terminal-state conditions (checkmate, stalemate, threefold repetition, 50-move rule, insufficient material — see `src/web/CONTEXT.md`); the Terminal state is detected and shown in the UI
- [ ] User can start a new Session without reloading the page
- [ ] A Session can be played end-to-end (move 1 to Terminal state) without any engine error or stuck state
- [ ] Move list in standard algebraic notation is visible during the Session

## Blocked by

None — can start immediately.
