# Toy ML tracer bullet

Status: ready-for-agent

## Parent

`.scratch/playlike-chess/PRD.md`

## What to build

Replace the random-Move backend from issue 01 with a real but tiny ML model trained on a small Lichess sample. Build the minimum viable version of every ML module needed end-to-end: **Lichess Corpus Ingester** (small sample, ~10K Games), **FEN Tokenizer** (char-level, canonicalized 4-field FEN — drops halfmove clock and fullmove number, see PRD Q8), **Action Vocabulary** (1968 UCI actions with legality mask), a ~1M-parameter Transformer with policy head, a **Base Trainer** that runs ~1 epoch, and the **Inference Engine** that loads the trained checkpoint and serves Moves through the existing `/move` route.

Greedy decoding only; no Adapter switching yet. The model will play poorly — that is fine. The point is to prove the ML pipeline is correctly wired and that the legality mask actually constrains the output.

## Acceptance criteria

- [ ] Lichess Corpus Ingester accepts a small PGN file (toy fixture) and produces shards of `(FEN, played-move)` Positions, applying the standard filter (rated, blitz, both ≥1800 Elo, normal-termination)
- [ ] FEN Tokenizer round-trip is over the *canonical* 4-field FEN: `decode(encode(fen))` equals `canonicalize(fen)` (i.e. the original FEN with halfmove clock and fullmove number stripped). Property test samples random legal FENs, asserts the canonical round-trip equality, and asserts the encoder accepts standard 6-field FEN input without crashing
- [ ] FEN Tokenizer sequence length is fixed and large enough to hold every canonical FEN that appears in `python-chess`'s output across a randomized board sample — no truncation under any test position
- [ ] Action Vocabulary's `legal_mask(board)` matches `python-chess`'s `set(board.legal_moves)` exactly across a battery of test boards
- [ ] Legality mask exposes a history-aware variant `legal_mask(board, move_history)` where `move_history` is the UCI move list from the Game's first move; it additionally kills threefold-repetition-causing Moves by replaying the history on a `python-chess` `Board` and using `board.is_repetition(3)` after pushing each candidate. Unit test covers a constructed move sequence that produces the same Position twice in history, and asserts the Move that would cause the 3rd appearance is masked out
- [ ] Mini-Transformer (~1M params) trains for ~1 epoch on the toy corpus without crashing; loss decreases over training
- [ ] Inference Engine loads the trained checkpoint, accepts a FEN, applies the legality mask before argmax, and returns a legal UCI Move via greedy decoding
- [ ] FastAPI `/move` route now uses the ML engine instead of random selection (random-Move code removed or behind a flag)
- [ ] User can play a complete Session in the browser against the ML model (see `src/web/CONTEXT.md` for Session definition)
- [ ] In 100 random Positions sampled from real Games, the engine returns 0 illegal Moves
- [ ] Unit tests exist for FEN Tokenizer (round-trip) and Action Vocabulary (legality mask alignment)

## Blocked by

- Issue 01 (Random-move tracer bullet)
