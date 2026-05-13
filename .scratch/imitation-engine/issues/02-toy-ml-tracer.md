# Toy ML tracer bullet

Status: ready-for-agent

## Parent

`.scratch/imitation-engine/PRD.md`

## What to build

Replace the random-Move backend from issue 01 with a real but tiny ML model trained on a small Lichess sample. Build the minimum viable version of every ML module needed end-to-end: **Lichess Corpus Ingester** (small sample, ~10K Games), **FEN Tokenizer** (lossless char-level), **Action Vocabulary** (1968 UCI actions with legality mask), a ~1M-parameter Transformer with policy head, a **Base Trainer** that runs ~1 epoch, and the **Inference Engine** that loads the trained checkpoint and serves Moves through the existing `/move` route.

Greedy decoding only; no Adapter switching yet. The model will play poorly — that is fine. The point is to prove the ML pipeline is correctly wired and that the legality mask actually constrains the output.

## Acceptance criteria

- [ ] Lichess Corpus Ingester accepts a small PGN file (toy fixture) and produces shards of `(FEN, played-move)` Positions, applying the standard filter (rated, blitz, both ≥1800 Elo, normal-termination)
- [ ] FEN Tokenizer is lossless: any FEN encoded then decoded equals the original (round-trip property test)
- [ ] Action Vocabulary's `legal_mask(board)` matches `python-chess`'s `set(board.legal_moves)` exactly across a battery of test boards
- [ ] Legality mask exposes a history-aware variant `legal_mask(board, recent_positions)` that additionally kills threefold-repetition-causing Moves; unit test covers a constructed sequence where the same Position repeats twice in `recent_positions` and the move that would cause the 3rd appearance is masked out
- [ ] Mini-Transformer (~1M params) trains for ~1 epoch on the toy corpus without crashing; loss decreases over training
- [ ] Inference Engine loads the trained checkpoint, accepts a FEN, applies the legality mask before argmax, and returns a legal UCI Move via greedy decoding
- [ ] FastAPI `/move` route now uses the ML engine instead of random selection (random-Move code removed or behind a flag)
- [ ] User can play a complete chess Game in the browser against the ML model
- [ ] In 100 random Positions sampled from real Games, the engine returns 0 illegal Moves
- [ ] Unit tests exist for FEN Tokenizer (round-trip) and Action Vocabulary (legality mask alignment)

## Blocked by

- Issue 01 (Random-move tracer bullet)
