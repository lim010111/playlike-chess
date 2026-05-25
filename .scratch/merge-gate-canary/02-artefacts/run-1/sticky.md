author:	github-actions
association:	contributor
edited:	false
status:	none
--
### `merge-gate / codex-review`
**Mode:** SOFT (report-only — findings shown, not blocking)
**Verdict:** needs-attention  ·  **Project:** chess_transformer

**Summary:** Adversarial review found one blocking issue in the diff against origin/main. I could not run the project test suite here because `uv`, `pytest`, and runtime deps such as `fastapi` are not installed in the environment.

| Severity | Count |
|---|---:|
| critical | 0 |
| high     | 1 |
| medium   | 0 |
| low      | 0 |

_Blocking decision: see the validator-layer section below (`.codex-review/validators.md`)._

**Top findings (critical/high, up to 3):**

1. **[high] Catch-all handler suppresses unexpected endpoint failures** — `src/engine/playlike_engine/api.py:42`
   The new outer `except Exception` converts every unexpected runtime/programming error in `/move` into a bare `HTTPException(500)` with `from None`. That suppresses the original traceback/chaining and treats real bugs in FEN parsing internals, move selection, or response construction as ordinary handled HTTP errors. In practice this removes the diagnostic signal FastAPI/Starlette would normally surface for unhandled exceptions, making future engine or adapter failures much harder to detect and triage.

_Full JSON: download the `codex-review` artefact from [this run](https://github.com/lim010111/playlike-chess/actions/runs/26391570063)._


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

- **[HIGH] uphold** `src/engine/playlike_engine/api.py:42` — src/engine/playlike_engine/api.py:42: `except Exception:  # noqa: BLE001 — staging hardening` / `raise HTTPException(status_code=500) from None`

<!-- Sticky Pull Request Commentmerge-gate-codex-review -->
--
