### `merge-gate / codex-review`
**Mode:** SOFT (report-only — findings shown, not blocking)
**Verdict:** needs-attention  ·  **Project:** chess_transformer

**Summary:** Reviewed the diff against `origin/main`. The branch contains a deliberate high-severity race regression in `useChessSession`; this should block merge. I did not run tests because the issue is directly visible in the one-line code change and current tests do not cover this race.

| Severity | Count |
|---|---:|
| critical | 0 |
| high     | 1 |
| medium   | 0 |
| low      | 0 |

_Blocking decision: see the validator-layer section below (`.codex-review/validators.md`)._

**Top findings (critical/high, up to 3):**

1. **[high] Stale engine responses can now mutate the live game** — `src/web/app/hooks/useChessSession.ts:90`
   The removed success-path `requestIdRef` check allows an older `/move` response to continue after a newer request has advanced `requestIdRef.current`. That stale response then acts on the current `chessRef.current`, despite the invariant comment above saying the monotonic id exists specifically to prevent late responses from prior turns overwriting current state. A stale success can append the wrong engine move/FEN if legal in the newer position, or hit the illegal-move path and `undo()` the current live move.

_Full JSON: download the `codex-review` artefact from [this run](https://github.com/lim010111/playlike-chess/actions/runs/26440122787)._


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

- **[HIGH] uphold** `src/web/app/hooks/useChessSession.ts:90` — src/web/app/hooks/useChessSession.ts:48: "Monotonic id so a late-arriving /move response from a prior turn cannot overwrite state for the current turn"

<!-- Sticky Pull Request Commentmerge-gate-codex-review -->
