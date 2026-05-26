### `merge-gate / codex-review`
**Mode:** SOFT (report-only — findings shown, not blocking)
**Verdict:** needs-attention  ·  **Project:** chess_transformer

**Summary:** The diff removes the rollback that keeps chess.js, React FEN, and history synchronized after a failed engine request. This is a blocking state-corruption regression.

| Severity | Count |
|---|---:|
| critical | 0 |
| high     | 1 |
| medium   | 0 |
| low      | 0 |

_Blocking decision: see the validator-layer section below (`.codex-review/validators.md`)._

**Top findings (critical/high, up to 3):**

1. **[high] Engine-error rollback leaves chess.js advanced after removing undo** — `src/web/app/hooks/useChessSession.ts:82`
   When postMove rejects for a non-terminal user move, the hook still advertises this path as a rollback and slices the last history entry, but it no longer undoes the already-applied user move in chessRef. setFen(chessRef.current.fen()) now publishes the advanced board instead of the pre-move board, while history removes the user's UCI move and error clears awaiting. The next move will be made from a position the engine rejected and a move_history that no longer matches the board, breaking the Web/Engine session contract and causing persistent client state corruption after any transient /move failure or 422 that is not terminal.

_Full JSON: download the `codex-review` artefact from [this run](https://github.com/lim010111/playlike-chess/actions/runs/26439877904)._


---

### `merge-gate / codex-review` — validator layer

**Mode:** SOFT (report-only — validator verdicts shown, not blocking)

| Severity | Count |
|---|---:|
| critical | 0 |
| high     | 1 |
| medium   | 0 |
| low      | 0 |

**Blocking validator verdicts (1):**

- **[HIGH] uphold** `src/web/app/hooks/useChessSession.ts:82` — src/web/app/hooks/useChessSession.ts:82: setFen(chessRef.current.fen()) with no preceding chessRef.current.undo()

<!-- Sticky Pull Request Commentmerge-gate-codex-review -->
