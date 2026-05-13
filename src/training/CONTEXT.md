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

**Ladder Elo**:
The strength rating estimated by having the model (Base + a given Adapter) play a tournament against an external reference engine at calibrated Elo bands (v1: Fairy-Stockfish at ELO-limit 1500 / 1800 / 2100 / 2400). The highest band where the model scores ≥ 50% is the model's Ladder Elo bracket. Complements Move-match accuracy, which only measures imitation fit.
_Avoid_: "Self-play Elo" — misleading, since the model is not playing against itself. The conventional self-play meaning (AlphaZero-style model-vs-self) is not what this metric is.

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
