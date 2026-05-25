author:	github-actions
association:	contributor
edited:	false
status:	none
--
### `merge-gate / codex-review`
**Mode:** SOFT (report-only — findings shown, not blocking)
**Verdict:** needs-attention  ·  **Project:** chess_transformer

**Summary:** Found one contract-breaking change in the `/move` request schema. I could not run the configured test command because `uv` is not installed in this runner; direct `python -m pytest` also cannot run because pytest/FastAPI are missing.

| Severity | Count |
|---|---:|
| critical | 0 |
| high     | 1 |
| medium   | 0 |
| low      | 0 |

_Blocking decision: see the validator-layer section below (`.codex-review/validators.md`)._

**Top findings (critical/high, up to 3):**

1. **[high] `/move` no longer accepts the documented `{ fen: string }` payload** — `src/engine/playlike_engine/api.py:18`
   The request model was renamed from `fen` to `position` while keeping `extra="forbid"`. Any existing or planned client following the project contract will now POST `{ "fen": ... }` and receive a 422 because `fen` is treated as an extra field and `position` is missing. This contradicts the Phase 1 acceptance criterion in `.scratch/playlike-chess/issues/01-random-move-tracer.md` and the Phase 2 frontend contract, both of which specify posting the FEN to `/move`. Restore `fen`, or add a backward-compatible alias and update the docs/tests deliberately.

_Full JSON: download the `codex-review` artefact from [this run](https://github.com/lim010111/playlike-chess/actions/runs/26393133477)._


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

- **[HIGH] uphold** `src/engine/playlike_engine/api.py:20` — src/engine/playlike_engine/api.py:20: `position: str` breaks the `{ fen: string }` contract in .scratch/playlike-chess/issues/01-random-move-tracer.md:29

<!-- Sticky Pull Request Commentmerge-gate-codex-review -->
--
