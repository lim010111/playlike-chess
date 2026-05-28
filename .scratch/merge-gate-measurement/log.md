# Soft-mode FPR measurement log

Backing data for `claude-harness-work#10` — soft → hard promotion.
PRs labelled `canary` (per claude-harness-work#09) are excluded.
Goal: N=10 non-canary PRs with FPR ≤ 1, then HITL sign-off and
flip `harness.toml [merge-gate].mode` to `"hard"`.

> **2026-05-28 — tally reset to N=0.** The vendored gate runtime was caught
> up to the post-`claude-harness-work#26` global layer (id-based validator
> pairing, plus `#22`/`#24`/`#28`). Per operator decision, the earlier
> soft-mode measurements — collected on the pre-`#26` gate — are voided and
> re-measurement starts fresh on the caught-up gate. The voided rows are
> kept below for audit only and do **not** count toward N=10.

Tally: **0 / 10** measured · FPR 0 · FNR 0

| # | PR | Merged | Codex (c/h/m/l) | Validator block | Sticky verdict | Would-block? (human) | Notes |
|---|----|--------|-----------------|-----------------|----------------|----------------------|-------|
| _(none yet — re-measuring on the caught-up gate)_ | | | | | | | |

**N=10 progress**: 0 measurable PRs on the caught-up gate. 10 needed.

**FPR so far**: 0/0.

---

## Voided — collected on pre-`#26` gate (audit only, not counted)

| # | PR | Merged | Codex (c/h/m/l) | Validator block | Sticky verdict | Would-block? (human) | Notes |
|---|----|--------|-----------------|-----------------|----------------|----------------------|-------|
| ~~1~~ | [#10 Phase 1 random-move /move + uv CI](https://github.com/lim010111/playlike-chess/pull/10) | 2026-05-25 | 0/0/2/0 | none | needs-attention (medium only, no block) | no | clean tracer-bullet; gate did not fire false positive on real feature work |
| ~~2~~ | [#20 Phase 2 frontend skeleton](https://github.com/lim010111/playlike-chess/pull/20) | 2026-05-26 | 0/0/0/0 | none | approve (no findings) | no | React + chess.js + apiClient + useChessSession + Node CI. Codex ran the Phase 2 diff locally (Biome, tsc, Vitest 7/7, Vite build) and produced 0 findings. Run `26437618147` |
| — | [#21 docs(tracker): check off Phase 2 ACs + refresh STATUS](https://github.com/lim010111/playlike-chess/pull/21) | 2026-05-26 | docs-only | docs-only | docs-only short-circuit | N/A | All paths matched `["**/*.md","docs/**","LICENSE","NOTICE"]`; Codex/validator skipped by design. Not measurable for FPR — excluded from N=10. Run `26438749294` |
