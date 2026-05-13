# PRD — Imitation Engine v1

Status: ready-for-agent

## Problem Statement

A chess hobbyist who wants to play in the style of a specific famous Player (say, Magnus Carlsen) currently has no good options: Stockfish plays objectively strong chess, not anyone's chess; Maia plays at a target Elo band, not as a named Player; and there is no engine that lets them play a game against "Magnus" or "Hikaru" at all. The project maintainer wants to ship a working chess engine that lets the user pick a Player from a closed roster and play a complete game against an Adapter trained to imitate that Player's blitz move distribution, with a Stockfish reference panel that contrasts the Adapter's chosen Move against the engine's recommendation. The result should run on the maintainer's local 3080 10GB hardware end-to-end (training and serving), legally, with response times suitable for interactive play.

## Solution

A Transformer-based chess engine plus a web UI built around it. Training is offline: a Base model is fine-tuned once on a Lichess corpus of strong blitz games, then a small LoRA-style Adapter is trained per Roster Player on that Player's Chess.com blitz archive. At runtime, a FastAPI server hosts the Base model in memory and switches between Adapters on a per-request basis. The frontend presents a chessboard, a Player selector, and a side panel that calls a local stockfish.wasm worker to display Stockfish's recommended Move alongside the model's. The closed Roster ships with five named Players: Magnus Carlsen, Hikaru Nakamura, Alireza Firouzja, Fabiano Caruana, Javokhir Sindarov.

## User Stories

### End-user stories (chess player)

1. As a chess player, I want to choose a named Player from a closed roster, so that I can play against that Player's imitation.
2. As a chess player, I want to play a full chess game (any number of moves, until terminal state) against the chosen Player's imitation, so that I get a complete game experience.
3. As a chess player, I want the engine to play only legal moves, so that the game is well-formed and I never have to reset because of an engine error.
4. As a chess player, I want to play either as White or Black, so that I experience both sides against the model.
5. As a chess player, I want the model's response within a couple of seconds, so that the game feels interactive rather than batch. *(Latency budget assumes single-digit concurrent active users on a single 3080; see `src/engine/CONTEXT.md` for the throughput ceiling and the ~25-user practical limit.)*
6. As a chess player, I want each game to vary even when I repeat the same opening, so that playing the same Player feels alive rather than scripted.
7. As a chess player, I want Stockfish's recommended Move displayed alongside the model's actual Move, so that I can see how a strong engine would have played the same Position.
8. As a chess player, I want to know which Player I am facing by their name on the screen, so that the experience is personalized.
9. As a chess player, I want the board UI to indicate whose turn it is, so that I am never confused about state.
10. As a chess player, I want the game to detect terminal states correctly (checkmate, stalemate, threefold repetition, 50-move rule, insufficient material), so that games end properly.
11. As a chess player, I want a move list in standard algebraic notation visible during the game, so that I can follow the game's history.
12. As a chess player, I want to start a new game without reloading the page, so that I can play multiple games per session.
13. As a chess player, I want the board to render correctly on a typical desktop browser, so that the demo works for the project's intended audience.
14. As a chess player, I want to be able to drag pieces and have the UI prevent illegal drops, so that input feels natural.
15. As a chess player, I want a short note on each Player explaining what their imitation actually represents (e.g. "blitz online play, ~2700 Elo"), so that I do not assume the Adapter mimics OTB classical games.

### Project maintainer stories (system-level)

16. As the project maintainer, I want a Base model trained on broad blitz Position data, so that every Adapter has a solid chess substrate to specialize from rather than learning chess from scratch.
17. As the project maintainer, I want per-Player Adapters trained at dev-time and shipped with each release, so that the runtime needs no training infrastructure (job queue, GPU scheduling, abuse handling).
18. As the project maintainer, I want each Adapter to imitate one Player's blitz move distribution specifically, so that style signal is not diluted by mixed time controls.
19. As the project maintainer, I want the Base model corpus filtered to rated blitz games where both players are ≥1800 Elo, so that the Base distribution is closer to the strong Players we will adapt toward.
20. As the project maintainer, I want the Lichess Corpus Ingester and Chess.com Player Ingester as separate modules, so that each can encapsulate its own external-API quirks (bulk dumps vs per-user PubAPI rate limits).
21. As the project maintainer, I want the Action Vocabulary to apply a legality mask at the policy head before sampling, so that the engine cannot emit an illegal Move.
22. As the project maintainer, I want the Inference Engine to support both greedy and sampling decoding, so that evaluation is deterministic (top-k metric) while gameplay is varied (no repeated games against the same Adapter).
23. As the project maintainer, I want the Inference Engine to load the Base model once at startup and select Adapters per request, so that latency stays in the 50–200ms range and adapter switching is cheap.
24. As the project maintainer, I want the Stockfish comparison to run via `stockfish.wasm` in the browser rather than via an external API, so that there is no rate limit, no external dependency, and the comparison panel works offline.
25. As the project maintainer, I want the model to fit and train on a single 3080 10GB GPU, so that no cloud spend is required for v1.
26. As the project maintainer, I want LoRA Adapters at rank 16 on attention QKVO projections only (FFN and policy head frozen), so that Adapters stay small and the Base model's general chess knowledge is preserved.
27. As the project maintainer, I want each Adapter to be a file of a few hundred KB, so that all five Adapters can ship in the deployment without bloat.
28. As the project maintainer, I want an Evaluation Harness that runs four checks (top-k Move-match accuracy, Ladder Elo vs Fairy-Stockfish, opening repertoire KL divergence, illegal-move count), so that I can decide pass/fail per Adapter without manual inspection.
29. As the project maintainer, I want training to log loss and metric curves, so that I can diagnose convergence and overfitting before evaluation.
30. As the project maintainer, I want training checkpoints saved periodically, so that a crash partway through Base training does not lose hours of compute.
31. As the project maintainer, I want a one-page model card per Player documenting source data, training metadata, and evaluation results, so that the deployment is self-documenting.
32. As the project maintainer, I want the FEN Tokenizer to be lossless and round-trippable (FEN → tokens → FEN), so that input encoding bugs are caught early.
33. As the project maintainer, I want the Action Vocabulary's UCI-to-index mapping to round-trip against `python-chess`'s legal-move enumeration, so that masking can never desynchronize from the chess rules.

### Future-contributor stories

34. As a future contributor, I want the Adapter format to be loadable independent of the runtime serving code, so that an open-roster v2 can add new Adapters without redeploy.
35. As a future contributor, I want clear ADRs for the irreversible architectural decisions, so that subsequent changes do not accidentally violate the foundations.
36. As a future contributor, I want a `CONTEXT-MAP.md` plus per-context `CONTEXT.md` files defining vocabulary (Position, Game, Player, Roster, Base model, Adapter, Move-match accuracy, Ladder Elo, Inference Engine, Decoding mode, Legality mask, Policy distribution), so that I can read the codebase without re-deriving terminology.

## Implementation Decisions

### Decisions inherited from grilling session

- **Scope (Q1)**: (C) usable tool with a 1500–1800 Elo minimum target.
- **Imitation definition (Q2)**: training loss = position-unit top-1 cross-entropy on (FEN, played-move). Evaluation is multi-metric: top-k Move-match accuracy + Ladder Elo + opening repertoire similarity.
- **Architecture (Q3, ADR-0001)**: Transformer over FEN-as-text tokens with a policy head over a fixed UCI action space (~1968 actions). Not LLM-style move-sequence decoder, not AlphaZero-style ResNet.
- **Data sources (Q4, ADR-0002)**: Lichess Open Database for Base training (bulk monthly PGN dumps), Chess.com PubAPI for per-Player Adapter training (one user-by-user query per Player).
- **Roster strategy (Q5, ADR-0003)**: closed roster, Adapters trained at dev-time, no runtime training infrastructure. Open-roster is a deliberate v2.
- **Model size (Q6)**: ~9M parameters, single 3080 10GB GPU, no cloud. DeepMind 2024 reference (Ruoss et al.) shows ~2300 Lichess-blitz Elo at this scale.
- **Per-Player time control (Q7)**: blitz only, no rapid mixing, no bullet.
- **Tokenizer + action space (Q8)**: char-level FEN tokenization (vocab ~32, fixed length ~78); UCI 1968 actions for the policy head; legality mask provided by `python-chess`.
- **LoRA configuration (Q9)**: rank 16 on attention QKVO projections in all layers; FFN frozen; policy head frozen; embedding frozen. Base remains entirely frozen during Adapter training.
- **Base data scale (Q10)**: 3 months of Lichess dumps, both players rated ≥1800, blitz only, normal-termination games — yields ~50M Positions after subsampling. Trained ~3 epochs.
- **Roster (Q11)**: Magnus Carlsen, Hikaru Nakamura, Alireza Firouzja, Fabiano Caruana, Javokhir Sindarov. Sindarov's Chess.com archive volume is unverified at PRD time; v1 ships him as-is regardless of volume — if his Adapter underperforms on evaluation, that is an empirical learning rather than a release blocker.
- **Evaluation thresholds (Q12)**: top-1 ≥ 40%, top-3 ≥ 70%; Base ≥ 1800 Elo on Fairy-Stockfish ladder; **Adapter Elo ≥ Base Elo - 100** (hard floor — >100 Elo regression is a fail and triggers v2 LoRA-scope expansion; stretch: Adapter ≥ Base; further stretch: Adapter ≥ Base + 100); opening repertoire KL with Adapter at least 5× closer to its Player than the Base is (this — not strength — is the primary imitation-fidelity metric); 0/100 illegal moves in self-play.
- **Engine interface (Q13)**: Web HTTP/WebSocket only — no UCI protocol in v1. Decoding is hybrid: greedy for evaluation top-1 metric, sampling (temperature ~0.7) for live gameplay and Ladder Elo measurement.
- **Web stack (Q14)**: React + `react-chessboard` + `chess.js` frontend; FastAPI backend with the inference engine in the same process; `stockfish.wasm` Web Worker in the browser for the comparison panel.

### Modules to build

**Deep modules (encapsulate logic behind stable interfaces, isolated unit tests):**

1. **Lichess Corpus Ingester** — input: month range, rating filter, time-control filter; output: shards of `(FEN, played-move)` Positions on disk. Encapsulates monthly `.zst` download, PGN streaming parser, filter application, Position extraction, sharded binary serialization.
2. **Chess.com Player Ingester** — input: Chess.com username, time-control filter; output: shards of `(FEN, played-move)` Positions for that Player. Encapsulates PubAPI archive paging, rate-limit-aware retry/backoff, JSON-to-PGN normalization, Position extraction.
3. **FEN Tokenizer** — interface: `fen → int tensor`, `int tensor → fen`. Char-level vocabulary with padding and fixed sequence length. Lossless and round-trippable.
4. **Action Vocabulary** — interface: `uci_string ↔ index`, `legal_mask(board, recent_positions=None) → bool[1968]`. UCI move enumeration, index assignment stable across runs, mask alignment validated against `python-chess`. When `recent_positions` is supplied, the mask additionally excludes Moves that would cause threefold repetition (history-aware stage; see `src/engine/CONTEXT.md`).
5. **LoRA Adapter Wrapper** — interface: `(base_model, rank, target_modules) → adapter_model`, `save_adapter(path)`, `load_adapter(path, base_model) → adapter_model`. Manages which modules are wrapped, parameter accounting, freeze state.
6. **Evaluation Harness** — interface: `(base_model, adapter, holdout_set, references) → EvalReport`. Runs all four checks, returns structured pass/fail per criterion.
7. **Inference Engine** — interface: `(fen, adapter_id, decoding_mode, temperature?) → Move (+ optional policy distribution)`. Loads Base + all Adapters at startup, switches Adapters at forward time, applies legality mask, dispatches greedy or sampling.

**Procedural modules (covered via integration tests, not isolated units):**

8. **Model Architecture** — declarative definition of the Transformer + policy head; mostly torch primitives.
9. **Base Trainer** — data loader over shards, optimizer, mixed-precision, checkpointing, logging.
10. **Adapter Trainer** — frozen-Base LoRA-only training loop, per-Player.
11. **Web API** — FastAPI routes: `POST /move` (FEN + adapter_id → Move), `WebSocket /play` (full game state turns), `GET /roster` (list of available Adapters).

**UI / external wrappers:**

12. **React UI** — board (`react-chessboard`), Player selector dropdown, comparison panel showing model Move vs Stockfish Move, move-list panel, terminal-state detection, new-game button.
13. **Stockfish WASM Wrapper** — Web Worker initialization, UCI command formatting (`position fen ...`, `go depth N`), response parsing, eval and best-move extraction.

### API contract

- `POST /move` — body `{ fen: string, adapter_id: "magnus" | "hikaru" | "firouzja" | "caruana" | "sindarov", decoding: "greedy" | "sample", temperature?: number, recent_positions?: string[] }` → response `{ move_uci: string, policy?: { uci: string, prob: number }[] }`. `recent_positions` is the recent Position history (FENs or position hashes, ~last 8 plies) used by the Engine's history-aware legality stage to mask threefold-causing Moves; if omitted, only rule-legality applies. Engine guarantees the returned Move is legal in the given Position.
- `WebSocket /play` — server pushes the model's Move when it is the model's turn; client sends user's Moves with the current Position.
- `GET /roster` — returns the closed Roster as `{ id, display_name, style_note, base_data_summary }[]`.

### Artifact contract

- Base model checkpoint: a single `.pt` file (~50 MB FP16), produced by Base Trainer. Pinned to the set of Lichess months ingested.
- Adapter weights: one `.pt` file per Roster Player (~few hundred KB), produced by Adapter Trainer, namespaced by Player ID. Pinned to a specific Chess.com snapshot ID (see below).
- **Archive snapshot manifest**: `data/snapshots/<player_id>/<YYYY-MM-DD>/manifest.json` recording fetch date, archive URL list, game count, position count, and content hash. Frozen at ingest time and never mutated in place — re-fetching the archive later produces a new snapshot. The Adapter, its hold-out split, and its Evaluation report all reference one snapshot ID. See ADR-0002 for the reproducibility contract.
- Roster manifest: `src/training/roster.json` with `[{id, display_name, chess_com_username, time_control, style_note, snapshot_id}]`. `style_note` is **hand-curated, ≤1 sentence**, describing what the imitation actually represents (e.g. `"online blitz play, ~2800 Chess.com rating, aggressive tactical style"`). Authored at release time, not auto-generated.
- Evaluation reports: one JSON per Adapter with all four check results plus the snapshot ID the evaluation was run against, attached to releases.
- **Model card**: `models/cards/<player_id>.md` — one page per Roster Player, hand-written but populated from artifacts. Required fields: Player identity (display name, Chess.com username), source data (snapshot ID, fetch date, game count, position count, time-control filter), training metadata (Base checkpoint hash, LoRA rank + target modules, training steps, key hyperparameters), evaluation summary (top-1/3 Move-match, Ladder Elo bracket, opening KL ratios, illegal-move count), and caveats (e.g. "Imitates online blitz only; does not reflect classical OTB style"). Satisfies User Story #31.

## Testing Decisions

### What makes a good test in this project

A good test exercises external behavior, not implementation details. For each Deep module, the test calls the module's public interface with realistic inputs and asserts on observable outputs. Tests should not assert on internal data structures, intermediate tensors, the specific shape of the optimizer state, or any decision that is reasonable to refactor. Tests should be fast (< 5s individually) and deterministic where possible (seeded sampling, fixed mini-corpora).

### Modules tested

**Deep module unit tests (all 7):**

- **Lichess Corpus Ingester**: feed a small fixture PGN file containing a mix of bullet/blitz/rapid games, varied ratings, normal and aborted terminations; assert the output shards contain only the games matching the filter, with the correct Position count per Game.
- **Chess.com Player Ingester**: with a mock HTTP layer returning canned PubAPI responses (multi-page archive, partial month, rate-limit response that recovers), assert the ingester pages through correctly, applies time-control filter, and produces shards that round-trip to the input PGN.
- **FEN Tokenizer**: round-trip property test — sample random legal FEN strings, encode and decode, assert equality. Also assert fixed sequence length and no out-of-vocab characters.
- **Action Vocabulary**: round-trip property test — for every UCI move that python-chess can produce in any legal position from a random sample of boards, assert `index_to_uci(uci_to_index(m)) == m`. Mask test: for several Positions, assert that the legal mask matches `set(board.legal_moves)` exactly (no extras, no omissions).
- **LoRA Adapter Wrapper**: assert that wrapping a Base model adds parameters only on the configured target modules; assert that saving and loading an Adapter from disk produces bit-identical forward outputs; assert that with the Adapter unloaded, the Base model's outputs match a fresh Base load.
- **Evaluation Harness**: with a mock model that returns scripted outputs, assert that top-k accuracy is computed correctly, that the Elo ladder logic returns the highest passed step, that opening KL is computed against the reference distribution, and that an illegal-move injection causes the legality check to fail.
- **Inference Engine**: with a small fixture model, assert that legality mask is applied (illegal moves never returned across 1000 random Positions), that greedy decoding is deterministic across calls, that sampling decoding produces varied moves over many calls, and that adapter switching changes the policy distribution.

**Integration tests (cover procedural modules via end-to-end mini-runs):**

- **Mini training run**: with a tiny synthetic corpus (~1000 Positions), run Base Trainer for 10 steps and assert loss decreases. Then run Adapter Trainer for 10 steps and assert (a) Base parameters unchanged, (b) Adapter loss decreases.
- **Mini API round-trip**: spin up FastAPI in-process, send `POST /move` with a starting Position, assert the response is a legal move; send `GET /roster` and assert the manifest is returned.

**UI / wrapper tests:**

- **Stockfish WASM Wrapper**: with a mocked Web Worker, send a position and assert the wrapper formats UCI commands correctly and parses the response (`bestmove e2e4` → `{ best: "e2e4", eval: ... }`).
- **React UI**: out of scope for automated tests in v1; manual smoke test against the running backend (load page, select Player, play five moves, observe Stockfish panel updating). Playwright E2E is a v2 candidate.

### Prior art

There is no existing test code in this repository (it is fresh). Test layout will follow the convention of co-locating tests with the module they cover (e.g. `src/training/data/lichess.test.py` next to `src/training/data/lichess.py`). No specific test framework is mandated by existing code; pytest for Python and Vitest/Jest for the frontend are the obvious defaults.

## Out of Scope

- **UCI protocol compliance**. The engine speaks only HTTP/WebSocket in v1. UCI is a v2 candidate that would unlock Lichess bot deployment and integration with chess GUIs (ChessBase, Arena).
- **Open-roster runtime training**. End users cannot submit a Chess.com username and request a custom Adapter. ADR-0003 codifies this as a deliberate v1 exclusion.
- **OTB classical games**. The Roster Adapters are trained on Chess.com online blitz only. OTB classical PGNs (e.g. from TWIC) are not ingested. Imitation is therefore "online blitz style" not "classical OTB style".
- **External API for Stockfish**. The original raw idea referenced chess-api.com; v1 instead uses `stockfish.wasm` in the browser. External API as a fallback for low-power clients is a v2 consideration.
- **Cloud-trained larger Base model**. The 50M+ or 150M+ parameter alternatives (Q6 options M2, M3) are deferred. Architecture and code support drop-in scale-up later.
- **LoRA hyperparameter tuning beyond the attention-QKVO baseline**. Adapter currently wraps attention QKVO only at rank 16. v2 will run a deliberately thorough hyperparameter sweep — LoRA scope (+FFN, +policy head, +embedding, and combinations), rank (4–64), alpha, target-module subsets, and per-Player overrides — to test whether expanded capacity unlocks the data-quality strength gain (the (a) force in ADR-0001). Trigger: any v1 Adapter regresses >100 Elo from Base, or qualitative review flags the Adapter as "stylistically off" despite passing opening-KL. The expanded sweep is its own dedicated v2 effort, not a quick patch.
- **Bullet time-control data**. Both Base corpus and per-Player Adapters exclude bullet, since bullet moves are dominated by reflex rather than style.
- **Multiplayer / matchmaking / accounts**. v1 is a single-user-per-session experience (one human per browser tab, playing against one Adapter) with no persistence beyond the active game state in the browser tab. Multiple independent browser sessions are supported and processed serially through the single GPU; the practical concurrent-user ceiling is documented in `src/engine/CONTEXT.md`.
- **Backend horizontal scaling / batched inference / explicit rate limiting**. The Inference Engine runs as a single FastAPI worker with serialized GPU forward. Batched inference, multi-GPU replication, opening-position caching, and explicit queue-length caps with friendly 503s are all deliberate v2 levers — triggered only if v1's portfolio-demo scale outgrows the natural single-GPU cliff (~25 concurrent active users before SLA breaches).
- **Mobile-optimized UI**. Desktop browser is the primary target; mobile is best-effort, not a v1 requirement.
- **Per-Player tunable temperature**. All Adapters use the same default temperature in v1. Per-Player temperature metadata is a v2 idea (e.g. aggressive Players might play with higher temperature).

## Further Notes

- Three ADRs codify the irreversible foundations: ADR-0001 (Transformer + FEN + policy head), ADR-0002 (split data sources), ADR-0003 (closed roster, dev-time training). Stockfish-as-wasm was deliberately not made an ADR because it is cheap to reverse.
- `CONTEXT-MAP.md` at the repository root, `src/training/CONTEXT.md`, and `src/engine/CONTEXT.md` establish the domain vocabulary used throughout this PRD (Position, Game, Player, Roster, Base model, Adapter, Move-match accuracy, Ladder Elo; Inference Engine, Decoding mode, Legality mask, Policy distribution). The Web context CONTEXT.md will be added once code-time reveals which terms are genuinely domain-meaningful versus implementation incidentals.
- Sindarov ships as-is regardless of his Chess.com blitz archive volume; the original verification-and-replacement plan was dropped. If his Adapter underperforms relative to the other four on evaluation, that is treated as an empirical observation, not a v1 release blocker.
- The Base model is expected to take ~20–30 hours of training time on the 3080 10GB GPU. Adapter training per Player should take minutes (LoRA rank 16, frozen Base).
- Top-1 accuracy threshold of 40% is a pre-measurement estimate. The first Adapter trained will calibrate this threshold; if real top-1 lands at, say, 35% across all Players, the threshold will be lowered to 30% rather than blocking the release.
- ChessBoard rendering, drag-drop, terminal-state detection, and SAN move-list logic are all delegated to `chess.js` + `react-chessboard`; the project does not reimplement chess rules in the frontend.
