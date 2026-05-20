# Evaluation Harness — four checks

Status: ready-for-agent

## Parent

`.scratch/playlike-chess/PRD.md`

## What to build

An offline evaluation script that takes a `(Base model, Adapter, Player)` triple and produces a JSON report covering all four agreed-upon metrics from the grilling session (Q12):

1. **Move-match accuracy (top-1 / top-3)** — on the Player's hold-out games (the most recent ~10% of the Player's archive, set aside from training), compute how often the Player's actual Move appears in the model's top-1 / top-3 policy logits when the matching Adapter is loaded.
2. **Head-to-head Elo delta (Adapter vs Base)** — Base alone plays Base+Adapter directly for 100 games at blitz time control, alternating colors, both sides under sample decoding (temperature 0.7). Adapter's score percentage is converted to an Elo delta via the standard formula `Δ = -400 · log10(1/score − 1)`. This — not the external Ladder — is the metric Adapter strength is judged against. The Base Ladder bracket recorded by issue 03 is echoed into the report as context only. See `src/training/CONTEXT.md` for the rationale.
3. **Opening repertoire KL divergence** — collect the top-50 ECO codes from the first 10 plies of the Player's actual archive, of self-play games with the Adapter loaded, and of self-play games with Base only. Report `KL(Player ‖ Adapter)` and `KL(Player ‖ Base)`. The Adapter is expected to be at least 5× closer.
4. **Illegal-move count** — over 100 self-play Games with the Adapter loaded, the count of illegal Moves emitted by the engine. Expected: 0.

The harness compares each metric against the Q12 thresholds (top-1 ≥ 40%, top-3 ≥ 70%, **Head-to-head Adapter score ≥ 36%** = ≤100 Elo regression — hard floor; >100 Elo regression is a fail signal that triggers v2 LoRA-scope expansion, opening KL Adapter ≤ Base KL / 5, illegal-move count = 0) and assigns pass/fail per criterion. Overall pass = all four pass. Reports are emitted as structured JSON and committed under `evaluation/reports/` per release.

Note that the top-1 ≥ 40% threshold is a pre-measurement estimate; if the first run measures, say, 35%, the threshold will be re-calibrated rather than blocking the release. The harness should make recalibration easy (thresholds in a config file, not hard-coded in the metric code).

## Acceptance criteria

- [ ] Evaluation Harness module accepts `(base_model, adapter, player_id)` and returns a structured `EvalReport` with all four metric values + per-criterion pass/fail
- [ ] Hold-out is consistently the most recent ~10% of the Player's **frozen snapshot** (`data/snapshots/<player_id>/<fetch-date>/`), not of the live Chess.com archive — split deterministic given the same snapshot ID, stable across re-evaluation regardless of upstream archive growth (see ADR-0002)
- [ ] Evaluation report records the `snapshot_id` it ran against alongside the metric values
- [ ] Top-k accuracy implementation is unit-tested against a mock model with scripted outputs
- [ ] Head-to-head Elo delta: Base vs Base+Adapter plays exactly 100 games at blitz TC, alternating colors, both sides under sample decoding (temperature 0.7); Adapter score and derived Elo delta (`Δ = -400 · log10(1/score − 1)`) recorded in report. Pass if Adapter score ≥ 36% (≤100 Elo regression); >100 Elo regression triggers v2 LoRA-scope expansion (see ADR-0001)
- [ ] Base's Ladder bracket (from issue 03 metadata) is read and echoed into the report as `base_ladder_bracket` for context — not re-measured per Adapter
- [ ] Opening repertoire KL is computed against three distributions: Player's archive (reference), Adapter self-play, Base-only self-play; both `KL(Player ‖ Adapter)` and `KL(Player ‖ Base)` reported
- [ ] Illegal-move count is recorded over exactly 100 self-play Games per Adapter
- [ ] Thresholds are read from a config file (e.g., `evaluation/thresholds.json`) so they can be adjusted without code change
- [ ] Report is emitted as a per-Adapter JSON file under `evaluation/reports/<player_id>/<timestamp>.json`
- [ ] Running the harness against the Magnus Adapter from issue 04 produces a complete, sensible report (whether passing or failing — the report itself must be well-formed)

## Blocked by

- Issue 04 (First Adapter end-to-end — Magnus)

Issue 05 is **not** a hard prerequisite — the harness only needs at least one Adapter to validate. Issue 05's other Adapters can be evaluated as they come online.
