# Training

The offline pipeline that turns chess game archives into trained models: a Base Transformer over FEN tokens, plus a closed Roster of per-Player LoRA-style Adapters.

## Language

**Position**:
A single board state paired with the move actually played from it, encoded as `(FEN, played-move)`. The atomic training and evaluation sample.
_Avoid_: "state", "board" (overloaded with the rendered UI board)

**Game**:
A complete sequence of Positions from one chess game, sharing one Player as White and one as Black.
_Avoid_: "match" (reserved for self-play matches during evaluation)

**Player**:
A specific named human chess player whose Game archive is used to fine-tune one Adapter. Member of the Roster.
_Avoid_: "user" (used for the human running the system), "model" (a Player has an Adapter, but is not itself a model)

**Roster**:
The fixed list of Players for whom Adapters are trained at dev-time and shipped with the system. Closed: adding a Player requires a new release.

**Base model**:
The Transformer trained once on the broad Lichess corpus. Learns chess generally; no Player conditioning. The substrate every Adapter is layered on.

**Adapter**:
A LoRA-style weight delta applied on top of the Base model that biases its outputs toward one Player's move distribution. Produced offline by fine-tuning on that Player's Game archive.

**Move-match accuracy (top-k)**:
On a held-out set of Positions from a Player's archive, the fraction where the Player's actual move appears in the model's top-k policy logits when the matching Adapter is loaded. The primary training success metric.

**Ladder bracket** (external anchor):
The coarse external rating band of the **Base model** alone, measured by having Base play Fairy-Stockfish at ELO-limit 1500 / 1800 / 2100 / 2400. The highest band where Base scores ≥ 50% is reported as Base's Ladder bracket. **Used as a one-time anchor** so the project can communicate "Base sits roughly in the X bracket of Fairy-Stockfish's reference pool" — not for Adapter-vs-Base comparison, which uses Head-to-head Elo delta instead.

Elo is fundamentally a relative rating: a Ladder bracket value is meaningful only within Fairy-Stockfish's calibration pool, which is *not* the same pool as Lichess blitz Elo or FIDE OTB classical Elo. Cross-pool comparisons (e.g. "1800 Lichess blitz training data → 1800 Fairy-Stockfish ladder") do not transfer automatically. Ladder resolution is also coarse (300-Elo buckets) — sufficient as an anchor, insufficient to detect a 100-Elo regression.

_Avoid_: "Ladder Elo" as a per-Adapter metric (it is Base-only, one-time), "Self-play Elo" (model does not play itself).

**Head-to-head Elo delta**:
The strength comparison between **Base** and a given **Adapter**, measured by playing N direct matches (v1: 100 games, blitz time control, alternating colors, both sides under sample decoding at temperature 0.7) between Base alone and Base + Adapter. Adapter's score percentage is converted to an Elo delta via the standard formula (`Δ = -400 · log10(1/score − 1)`). This is the metric the >100-Elo-regression fail signal is computed against.

Why direct head-to-head instead of ladder for Adapter evaluation: ladder resolution (300-Elo buckets) is too coarse to detect a 100-Elo gap, and ladder-pool calibration is loose. Head-to-head measures the only thing we actually need — *how Adapter strength compares to its own Base* — without leaning on any external pool's yardstick.

_Avoid_: collapsing "Head-to-head Elo delta" and "Ladder bracket" into one number — they measure different things on different pools.

## Relationships

- A **Game** decomposes into ~40 **Positions**.
- A **Player** owns a **Game** archive, which produces exactly one **Adapter**.
- The **Base model** is trained once. Each **Player** in the **Roster** produces one **Adapter** layered on top of the same **Base model**.

## Example dialogue

> **Dev:** "If we have 5,000 **Games** for a **Player**, that's roughly 200K **Positions** for **Adapter** fine-tuning."
> **Domain expert:** "Right, but filter to one time-control band first — the same **Player**'s blitz and classical **Positions** have different distributions, and mixing them dilutes the style signal."

## Flagged ambiguities

- "model" was used loosely to mean either the **Base model**, an **Adapter**, or both combined. Resolved: **Base model** is the foundation, **Adapter** is the per-Player delta, and "the engine" (Engine context) is what loads both together at inference time.
- "fine-tuning" vs "PEFT" was used interchangeably in the original brief. Resolved: per-Player training uses LoRA-style **Adapter** weights, not full-parameter fine-tuning. "Fine-tuning" in this context means Adapter training unless explicitly noted.
