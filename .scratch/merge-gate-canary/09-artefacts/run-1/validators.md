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
