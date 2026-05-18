# Real Base model training

Status: ready-for-agent

## Parent

`.scratch/playlike-chess/PRD.md`

## What to build

Scale up the toy ML pipeline from issue 02 to the real Base model per the project's architecture and data decisions (ADR-0001 for model shape; ADR-0002 for data source). Lichess Corpus Ingester downloads 3 months of `lichess_db_standard_rated_*.pgn.zst` dumps and produces ~50M filtered Positions. Model grows to ~9M parameters (Transformer over FEN tokens + policy head over UCI 1968 actions). Base Trainer adds mixed-precision, periodic checkpointing, and loss + train/val accuracy curve logging. Training runs ~3 epochs on a 3080 10GB (~20–30h). The trained Base checkpoint replaces the toy model in the running engine.

## Acceptance criteria

- [ ] Lichess Corpus Ingester automates download + decompression + streaming PGN parse for 3 months of dumps
- [ ] After filter (rated, blitz, both ≥1800 Elo, normal-termination), ~50M Positions are produced as binary shards on disk
- [ ] **Modern-transformer architecture survey completed and written down before any 9M training run starts**: a deliberate per-axis review of 2024–2026 small-transformer variants — positional encoding (learned vs sinusoidal vs RoPE vs ALiBi vs 2D-board-aware), LayerNorm placement (pre-LN vs post-LN), MLP block (GELU vs SwiGLU vs ReLU² vs GLU variants), attention kernel (vanilla MHA vs SDPA vs FlashAttention 2), mixed-precision dtype, head count / dim ratio, dropout, init, tied embeddings — against the Ruoss et al. 2024 baseline. Output: a markdown decision record (can live alongside this issue or as an ADR if any axis is genuinely surprising) that names the chosen value for each axis with one-line rationale. See ADR-0001 "Sub-architecture — deferred to issue 03 with mandatory survey"
- [ ] Model is configured at ~9M parameters using the survey's chosen sub-architecture (a typical layout starting point: hidden ~256, layers ~8, heads ~8 — exact dims tunable so long as total is ~9M)
- [ ] Base Trainer uses mixed-precision (FP16 or BF16); fits in 10GB VRAM for a reasonable batch size
- [ ] Checkpoint saved every N steps
- [ ] **wandb experiment tracking** for the Base training run. Logged: per-step train loss, train top-1 accuracy (every N steps), val loss + val top-1 accuracy (every epoch on a fixed Lichess hold-out), learning rate, grad norm, weight norm, GPU util / VRAM (via wandb's free system metrics). Run config dict captures: model hyperparameters (post-survey values), optimizer, batch size, mixed-precision dtype, Lichess snapshot ID, git commit SHA. Sample policy distributions on a fixed set of ~10 sanity Positions logged every epoch so divergence/mode-collapse during a 20–30h run is visible from the wandb run URL without SSH'ing into the box. Offline mode (`wandb.init(mode="offline")`) is acceptable if hosted SaaS is undesirable for a given run — training itself does not depend on wandb connectivity
- [ ] Training completes 3 epochs without OOM
- [ ] Trained Base checkpoint loads into Inference Engine and the engine serves Moves via `/move` using the real Base
- [ ] Self-play 100 Games with the real Base: 0 illegal Moves
- [ ] Manual play in the browser shows recognizably stronger Base play than the toy model (qualitative — at minimum, sensible openings and no obvious one-Move blunders in trivial Positions)
- [ ] Final loss + accuracy logged values are committed alongside the checkpoint metadata
- [ ] **Ladder bracket anchor measured once on the trained Base**: Base plays Fairy-Stockfish at ELO-limit 1500 / 1800 / 2100 / 2400 (≥50 games per step, blitz TC, sample decoding); the highest passed bracket is recorded in Base checkpoint metadata as `ladder_bracket`. This is a one-time external anchor — Adapter strength comparisons use the head-to-head harness in issue 07, not this number. See `src/training/CONTEXT.md` for why Ladder is treated as an anchor rather than a precise per-model metric.

## Blocked by

- Issue 02 (Toy ML tracer bullet)
