# Soft-mode FPR measurement log

Backing data for `claude-harness-work#10` — soft → hard promotion.
PRs labelled `canary` (per claude-harness-work#09) are excluded.
Goal: N=10 non-canary PRs with FPR ≤ 1, then HITL sign-off and
flip `harness.toml [merge-gate].mode` to `"hard"`.

| # | PR | Merged | Codex (c/h/m/l) | Validator block | Sticky verdict | Would-block? (human) | Notes |
|---|----|--------|-----------------|-----------------|----------------|----------------------|-------|
| 1 | [#10 Phase 1 random-move /move + uv CI](https://github.com/lim010111/playlike-chess/pull/10) | 2026-05-25 | 0/0/2/0 | none | needs-attention (medium only, no block) | no | clean tracer-bullet; gate did not fire false positive on real feature work |

**FPR so far**: 0/1.
