# Context Map

This project produces a chess engine that, given a board position (FEN), returns a move played in the style of a specific named human player chosen from a closed roster. Work splits into three contexts.

## Contexts

- [Training](./src/training/CONTEXT.md) — offline pipeline: ingests game archives, trains the Base model on a broad corpus, and fine-tunes one Adapter per roster Player.
- [Engine](./src/engine/CONTEXT.md) — runtime server: loads the Base model + all Roster Adapters at startup, accepts a Position + Player choice, returns a legal Move. Single-worker, serialized GPU forward.
- **Web** — browser-facing UI: lets the user choose a Player, play against the resulting model, and see Stockfish's recommendation alongside the model's. *(CONTEXT.md to be added when first UI-specific term resolves.)*

## Relationships

- **Training → Engine**: Training emits two artifact families consumed by Engine — the Base model checkpoint and the per-Player Adapter weights. Adapters are produced once per Roster member at dev-time; Engine loads them at runtime.
- **Engine ↔ Web**: Web sends the current Position (FEN) plus the selected Player's Adapter ID; Engine returns a single legal Move (and optionally the policy distribution over candidates). Synchronous request/response, no events.
- **Web → External (Stockfish)**: Web calls Stockfish (via chess-api.com) directly with the current Position to render the comparison panel. Engine is not in the Stockfish path.
