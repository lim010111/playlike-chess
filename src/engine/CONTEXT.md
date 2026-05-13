# Engine

The runtime that, given a Position and a Player choice, returns a Move. Loads the Base model and all Roster Adapters at startup and selects an Adapter per request.

## Language

**Inference Engine**:
The runtime module wrapping the Base model and all Roster Adapters. Exposes `(Position, adapter_id, decoding_mode) → Move (+ optional policy distribution)`. Handles legality masking, decoding-mode dispatch, and per-request Adapter selection. Distinct from the Web API layer that calls it.
_Avoid_: bare "model" (overloaded — see Training CONTEXT for **Base model** vs **Adapter**)

**Decoding mode**:
How a Move is chosen from the policy logits over legal Moves. Two modes:
- **Greedy** — deterministic argmax over the masked logits. Used by the Evaluation Harness for the top-1 Move-match metric.
- **Sample** — temperature-scaled softmax sampling (default temperature 0.7). Used in live gameplay so repeating an opening does not produce identical Games.

Orthogonal to Player choice (any Adapter can be played in either mode) and to legality (mask applies in both).

**Legality mask**:
The boolean tensor over the 1968-action UCI space applied before decoding to set illegal-Move logits to -∞. Computed in two stages:
1. **Rule legality** — `python-chess` `board.legal_moves` from the FEN. Covers all chess rules whose verdict depends only on the current Position (piece movement, check, pin, en-passant, castling rights encoded in FEN).
2. **History-aware legality** — kills moves that would cause threefold repetition. Computed from the `move_history` (UCI moves from the Game's first move) that the Web context attaches to every `/move` request: the Engine replays the moves on a `python-chess` `Board`, then for each candidate Move pushes it and calls `board.is_repetition(3)`. Delegating to `python-chess` is deliberate — FIDE's "same Position" definition has subtle ep/castling/clock semantics that are easy to get wrong with manual FEN equality. The model is Markov over FEN, so without this stage the Inference Engine would have no protection against accidentally drawing a winning Position by repeating it (see ADR-0001 Markov section).

The 50-move-rule clock lives in the FEN and is already handled by stage 1. 5-fold and 75-move (automatic) are detected client-side as game-over events; the Inference Engine itself does not refuse to move once they occur.

_Avoid_: "legal moves filter" — **mask** is the canonical term.

**Policy distribution**:
The post-mask, post-softmax distribution over the 1968 UCI actions for a given Position+Adapter+decoding-mode. Returned optionally for the comparison panel and the Evaluation Harness.

## Implementation notes

Not domain language, but load-bearing v1 decisions:

- The Inference Engine runs as a **single FastAPI worker process** on one GPU. Base + 5 Adapters share one VRAM allocation (≈52MB in FP16). All `/move` requests serialize through a GPU forward lock — concurrent requests are queued, not parallel.
- Adapter selection is **in-place per request**: the worker activates the requested Adapter, runs the forward pass, returns the Move, then accepts the next request. Two simultaneous requests for different Adapters are safe because they cannot overlap on the GPU (the lock guarantees no interleaved state mutation).
- The server is **stateless per request**. Game state lives in the browser (`chess.js`). The same Position with the same Adapter under greedy decoding returns the same Move every time; under sampling, varied.
- Throughput ceiling ≈ 7–10 moves/sec on the 3080. Practical concurrent active-user limit ≈ 25 before PRD User Story #5's "couple of seconds" budget starts breaking; beyond ~35 the request queue grows unboundedly. v1 has no rate limiting — this cliff is accepted as the scale of a portfolio demo. Batched inference, multi-GPU, and explicit backpressure are deliberate v2 levers (see PRD Out of Scope).

## Relationships

- **Training → Engine**: The Inference Engine consumes two artifact families produced by Training — one Base model checkpoint and one Adapter file per Roster Player. Engine never re-trains or modifies these artifacts.
- **Engine ↔ Web**: Web calls the Engine via `POST /move` (FEN + adapter_id + move_history → Move) and `WebSocket /play`. Engine returns one legal Move per call. Web owns Session storage — the source of truth for the running Session lives in the browser's `chess.js` — but attaches the full UCI `move_history` to every request so the Engine's history-aware legality mask works without server-side state. Terminal-state detection and draw claiming remain Web-side; the Engine is never asked "is the Session over?", only "given this Position and history, what is your Move?". See `src/web/CONTEXT.md` for the Session, Opponent, and Terminal-state vocabulary.
- **Engine ⊥ Stockfish**: The Engine is not in the Stockfish comparison path. Stockfish runs client-side via `stockfish.wasm`. Engine and Stockfish are independent move sources that the Web context renders side by side.
