# Soft-mode FPR measurement log

Backing data for `claude-harness-work#10` — soft → hard promotion.
PRs labelled `canary` (per claude-harness-work#09) are excluded.
Goal: N=10 non-canary PRs with FPR ≤ 1, then HITL sign-off and
flip `harness.toml [merge-gate].mode` to `"hard"`.

| # | PR | Merged | Codex (c/h/m/l) | Validator block | Sticky verdict | Would-block? (human) | Notes |
|---|----|--------|-----------------|-----------------|----------------|----------------------|-------|
| 1 | [#10 Phase 1 random-move /move + uv CI](https://github.com/lim010111/playlike-chess/pull/10) | 2026-05-25 | 0/0/2/0 | none | needs-attention (medium only, no block) | no | clean tracer-bullet; gate did not fire false positive on real feature work |
| 2 | [#20 Phase 2 frontend skeleton](https://github.com/lim010111/playlike-chess/pull/20) | 2026-05-26 | 0/0/0/0 | none | approve (no findings) | no | React + chess.js + apiClient + useChessSession + Node CI. Codex ran the Phase 2 diff locally (Biome, tsc, Vitest 7/7, Vite build) and produced 0 findings. Run `26437618147` |
| — | [#21 docs(tracker): check off Phase 2 ACs + refresh STATUS](https://github.com/lim010111/playlike-chess/pull/21) | 2026-05-26 | docs-only | docs-only | docs-only short-circuit | N/A | All paths matched `["**/*.md","docs/**","LICENSE","NOTICE"]`; Codex/validator skipped by design. Not measurable for FPR — excluded from N=10. Run `26438749294` |

**N=10 progress**: 2 measurable PRs logged (rows 1, 2). PR #21
excluded as docs-only. 8 more measurable non-canary PRs needed.

**FPR so far**: 0/2.
