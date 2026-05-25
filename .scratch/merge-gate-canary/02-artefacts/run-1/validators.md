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
