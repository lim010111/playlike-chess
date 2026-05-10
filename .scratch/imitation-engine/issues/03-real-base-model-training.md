# Real Base model training

Status: ready-for-agent

## Parent

`.scratch/imitation-engine/PRD.md`

## What to build

Scale up the toy ML pipeline from issue 02 to the real Base model per the project's architecture and data decisions (ADR-0001 for model shape; ADR-0002 for data source). Lichess Corpus Ingester downloads 3 months of `lichess_db_standard_rated_*.pgn.zst` dumps and produces ~50M filtered Positions. Model grows to ~9M parameters (Transformer over FEN tokens + policy head over UCI 1968 actions). Base Trainer adds mixed-precision, periodic checkpointing, and loss + train/val accuracy curve logging. Training runs ~3 epochs on a 3080 10GB (~20–30h). The trained Base checkpoint replaces the toy model in the running engine.

## Acceptance criteria

- [ ] Lichess Corpus Ingester automates download + decompression + streaming PGN parse for 3 months of dumps
- [ ] After filter (rated, blitz, both ≥1800 Elo, normal-termination), ~50M Positions are produced as binary shards on disk
- [ ] Model is configured at ~9M parameters (a typical layout: hidden ~256, layers ~8, heads ~8 — exact dims tunable so long as total is ~9M)
- [ ] Base Trainer uses mixed-precision (FP16 or BF16); fits in 10GB VRAM for a reasonable batch size
- [ ] Checkpoint saved every N steps; loss + top-1 train/val accuracy logged per epoch (CSV or TensorBoard or equivalent)
- [ ] Training completes 3 epochs without OOM
- [ ] Trained Base checkpoint loads into Inference Engine and the engine serves Moves via `/move` using the real Base
- [ ] Self-play 100 Games with the real Base: 0 illegal Moves
- [ ] Manual play in the browser shows recognizably stronger Base play than the toy model (qualitative — at minimum, sensible openings and no obvious one-Move blunders in trivial Positions)
- [ ] Final loss + accuracy logged values are committed alongside the checkpoint metadata

## Blocked by

- Issue 02 (Toy ML tracer bullet)
