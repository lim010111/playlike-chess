# Web

The browser-facing UI: lets the user choose a Roster Player, play a complete chess Session against the resulting Adapter, and see Stockfish's recommendation alongside the Adapter's chosen Move.

## Language

**Session**:
One complete chess play instance in a single browser tab — from the starting Position to a Terminal state (or to a new-Session reset). Bounded by: one human player + one chosen Adapter (the Opponent), one selected human color (White or Black), one continuous game-state owned by the browser's `chess.js`. Distinct from Training's **Game** — a training **Game** is an archived sequence with one Player on each side; a Session is live, has only one Player (the Opponent), and is never persisted server-side. The same Position with the same Opponent and the same `move_history` returns the same Move under greedy decoding; under sampling, varied.
_Avoid_: bare "Game" when meaning live play (use **Session**); "match" (reserved for self-play matches during Evaluation, see Training CONTEXT).

**Opponent**:
The Roster **Player** selected for the current Session, exposed to the user as "Playing against: Magnus Carlsen". Realized in the wire as the `adapter_id` sent on every `/move` request. From the user's perspective the Opponent is "the Player I face"; from the Engine's perspective it is "which Adapter is active for this request". Switching Opponents during a Session is not supported in v1 — selection is made at Session start and persists until a new Session.
_Avoid_: bare "Player" in Web context (Player is Roster-only; the user is never a Player).

**Terminal state**:
The set of conditions on which a Session ends. Five chess-rule terminations are detected and rendered by the Web client via `chess.js` (the Engine is not consulted — see Engine CONTEXT for the "is the Session over?" non-contract):
1. **Checkmate** — side to move has no legal Moves and is in check.
2. **Stalemate** — side to move has no legal Moves and is not in check.
3. **Threefold repetition** — same Position occurs three times (FIDE-canonical equality; `chess.js` `isThreefoldRepetition()`). User-claimable per FIDE; in v1 the Web client auto-ends the Session.
4. **50-move rule** — 100 half-moves without capture or pawn move. User-claimable per FIDE; auto-ended as above.
5. **Insufficient material** — neither side has mating material per FIDE.

In addition, the user can **resign** or start a **new Session** at any point — user-initiated terminations, not chess-rule terminations.
_Avoid_: "game-over event" — **Terminal state** is the canonical term, and it is the enum-shaped concept the UI dispatches on.

## Relationships

- A **Session** is constituted by one **Opponent** (an Adapter), one human color choice, and a growing `move_history` (the same UCI list the Engine receives on every `/move` request). When a **Terminal state** is reached, the Session ends.
- **Web ↔ Engine**: see `src/engine/CONTEXT.md`. Web sends Position + `adapter_id` + `move_history` per turn; Engine returns one legal Move. Web owns Session storage; the Engine is stateless per request.
- **Web ↔ Stockfish (in-browser)**: `stockfish.wasm` runs in a Web Worker and analyses the current Position for the comparison panel. Stockfish never sees the Opponent's identity or the Adapter — it is an independent analysis source rendered side by side with the Adapter's Move.

## Implementation notes

Not domain language, but load-bearing v1 decisions:

- Session state lives **only in the browser**. Page refresh discards it. No server-side persistence — see PRD Out of Scope on multiplayer/accounts.
- A user has exactly **one Opponent per Session**. Changing Opponent requires a new Session.
- Comparison panel, Player selector, move list, new-Session button are UI components (implementation-incidental) and are deliberately kept out of this glossary.
