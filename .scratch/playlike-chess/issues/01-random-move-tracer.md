# Random-move tracer bullet

Status: ready-for-agent

## Parent

`.scratch/playlike-chess/PRD.md`

## What to build

A complete vertical tracer through the entire web stack — React board ↔ FastAPI backend ↔ python-chess — where the engine simply picks a random legal Move from the current Position. No ML, no model loading, no Adapter switching, no Stockfish. The point is to validate that the React + `react-chessboard` + `chess.js` + FastAPI + python-chess stack composes correctly, that the API contract works, and that an end user can play a complete Session in the browser before any ML work begins. ("Session" = one complete live play instance in a browser tab from start to a Terminal state — see `src/web/CONTEXT.md`.)

The slice exists primarily to de-risk the plumbing. Subsequent slices replace the random-move backend with real ML inference, but the surrounding infrastructure (web server, board UI, API contract, Terminal-state handling) stays.

## Acceptance criteria

- [ ] FastAPI server exposes `POST /move` accepting `{ fen: string }` and returning `{ move_uci: string }`
- [ ] Backend uses `python-chess` `board.legal_moves` and returns a uniformly random selection
- [ ] React frontend renders the starting Position via `react-chessboard`
- [ ] User can drag pieces; `chess.js` prevents illegal drops on the client
- [ ] On a user Move, frontend POSTs the resulting FEN to `/move` and applies the engine's response
- [ ] Session terminates correctly on each of the five Terminal-state conditions (checkmate, stalemate, threefold repetition, 50-move rule, insufficient material — see `src/web/CONTEXT.md`); the Terminal state is detected and shown in the UI
- [ ] User can start a new Session without reloading the page
- [ ] A Session can be played end-to-end (move 1 to Terminal state) without any engine error or stuck state
- [ ] Move list in standard algebraic notation is visible during the Session

## Blocked by

None — can start immediately.
