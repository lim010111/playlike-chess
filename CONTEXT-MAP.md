# Context Map

This project produces a chess engine that, given a board position (FEN), returns a move played in the style of a specific named human player chosen from a closed roster. Work splits into three contexts.

## Contexts

- [Training](./src/training/CONTEXT.md) — offline pipeline: ingests Game archives, trains the Base model on a broad corpus, and fine-tunes one Adapter per Roster Player.
- [Engine](./src/engine/CONTEXT.md) — runtime server: loads the Base model + all Roster Adapters at startup, accepts a Position + Opponent choice, returns a legal Move. Single-worker, serialized GPU forward.
- [Web](./src/web/CONTEXT.md) — browser-facing UI: lets the user pick an Opponent (Roster Player), play a Session against the resulting Adapter, and see Stockfish's recommendation alongside the Adapter's Move.

## Relationships

- **Training → Engine**: Training emits two artifact families consumed by Engine — the Base model checkpoint and the per-Player Adapter weights. Adapters are produced once per Roster member at dev-time; Engine loads them at runtime.
- **Engine ↔ Web**: Web sends the current Position (FEN) plus the selected Opponent's `adapter_id` plus the Session's `move_history`; Engine returns a single legal Move (and optionally the policy distribution over candidates). Synchronous request/response, no events. Web owns Session storage; Engine is stateless per request.
- **Web ↔ Stockfish (in-browser)**: Web runs `stockfish.wasm` in a Web Worker to produce a recommended Move for the comparison panel. Engine is not in the Stockfish path; the two are independent move sources rendered side by side.
