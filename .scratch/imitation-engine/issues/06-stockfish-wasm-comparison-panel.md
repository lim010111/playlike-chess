# Stockfish.wasm comparison panel

Status: ready-for-agent

## Parent

`.scratch/imitation-engine/PRD.md`

## What to build

A side panel in the React UI that, for the current Position on the board, queries Stockfish in the browser via WebAssembly and displays Stockfish's recommended Move and evaluation alongside the model's response. Build the **Stockfish WASM Wrapper** (Web Worker initialization, UCI command formatting like `position fen ...` and `go depth N`, response parsing for `bestmove` and `info` lines). Wire it into the React UI as a panel that updates whenever the board Position changes.

The panel is purely client-side — it does not affect the Engine, does not call any external service, and works offline after the initial wasm download. This deliberately replaces the original idea of using chess-api.com (Q14 — stockfish.wasm avoids rate limits, network latency, and external dependencies).

This slice is independent of the ML pipeline and can be implemented in parallel with issues 02–05, as long as issue 01's React UI exists.

## Acceptance criteria

- [ ] `stockfish.wasm` is bundled in the frontend (npm package or static asset; no network call to download at runtime)
- [ ] Stockfish WASM Wrapper initializes a Web Worker on demand and exposes an interface like `analyze(fen, depth) → Promise<{ bestMove, evalCp | mate }>`
- [ ] Wrapper formats UCI commands correctly (`uci`, `isready`, `position fen <fen>`, `go depth N`) and parses `bestmove` and `info` responses
- [ ] React UI includes a comparison panel that calls `analyze` on every Position change
- [ ] Panel shows Stockfish's recommended Move (in SAN) and evaluation (centipawns or mate-in-N)
- [ ] Model's actual chosen Move is shown next to Stockfish's recommendation so the user can compare them at a glance
- [ ] Zero network requests to chess-api.com or any other external Stockfish service
- [ ] Panel continues to function with the network disconnected (after initial wasm load)
- [ ] Wrapper has a unit test covering UCI command formatting and `bestmove`/`info` response parsing (Web Worker may be mocked)

## Blocked by

- Issue 01 (Random-move tracer bullet) — needs the React UI scaffolding from issue 01

Independent of issues 02–05; can be implemented in parallel with the ML pipeline.
