# First Adapter end-to-end (Magnus)

Status: ready-for-agent

## Parent

`.scratch/playlike-chess/PRD.md`

## What to build

Establish the per-Player Adapter pipeline end-to-end by training Magnus Carlsen's Adapter and serving it through the engine. Build the **Chess.com Player Ingester** (PubAPI archive paging, rate-limit-aware retry, time-control filter for blitz only, opponent-rating-gap filter ±400 Elo, `rated == true` only — see PRD Q-rating-gap). Build the **LoRA Adapter Wrapper** (rank 16 on attention QKVO projections only; FFN, embedding, and policy head frozen — see ADR-0001 and the per-Player Adapter form decision). Build the **Adapter Trainer** (Base entirely frozen, only Adapter parameters trained). Train the Magnus Adapter on his Chess.com blitz archive. Extend Inference Engine and `/move` to accept an `adapter_id` parameter and apply the corresponding Adapter at forward time. Add minimal UI text indicating which Player is being faced.

This slice covers one Player end-to-end so that the per-Player infrastructure is fully validated before being applied to the full Roster (issue 05).

## Acceptance criteria

- [ ] Chess.com Player Ingester fetches Magnus's archive via PubAPI, paging through monthly archives, with rate-limit-aware retry/backoff
- [ ] Time-control filter retains only blitz Games (3+0, 3+2, 5+0, 5+5 — Chess.com's `time_class == "blitz"`)
- [ ] Opponent-rating-gap filter: keep only games where `rated == true` and the opponent's per-game `rating` (PubAPI: "the player's rating after the game finished") is within ±400 Elo of Magnus's per-game `rating`. Per-game application, not aggregate. Rationale: removes trolling/handicap games whose move distribution dilutes style signal — see PRD Q-rating-gap.
- [ ] `manifest.json` records pre-filter and post-filter game counts separately so the rating-gap filter's effect on data volume is auditable
- [ ] Magnus's filtered archive is converted to `(FEN, played-move)` Position shards and written under `data/snapshots/magnus/<fetch-date>/` with a `manifest.json` (fetch date, archive URL list, pre-filter and post-filter game counts, position count, content hash) — see ADR-0002
- [ ] Adapter checkpoint metadata records the `snapshot_id` it was trained against
- [ ] LoRA Adapter Wrapper attaches rank-16 LoRA modules to attention Q, K, V, O projections in every Transformer layer; FFN, embedding, and policy head are frozen and verifiably untouched after training
- [ ] Adapter checkpoint round-trips: `save → load` produces bit-identical forward outputs
- [ ] Adapter Trainer runs with Base frozen — Base parameter values do not change during training; Adapter parameters do change; training loss decreases
- [ ] Magnus Adapter file is < 1 MB on disk
- [ ] Inference Engine loads Base + Magnus Adapter at startup; `/move` accepts `adapter_id="magnus"` and returns Moves with the Adapter applied
- [ ] Both decoding modes work: `decoding="greedy"` (deterministic, for evaluation top-1) and `decoding="sample"` (temperature ~0.7, for live gameplay)
- [ ] UI shows "Playing against: Magnus Carlsen" while a Session is in progress (Magnus = the Session's Opponent — see `src/web/CONTEXT.md`)
- [ ] Self-play 100 Games with Magnus Adapter: 0 illegal Moves
- [ ] Unit tests cover LoRA Adapter Wrapper (frozen-Base invariant + save/load round-trip)
- [ ] Model card committed at `models/cards/magnus.md` with the fields specified in PRD's Artifact contract (Player identity, source data with snapshot ID, training metadata, evaluation summary, caveats) — satisfies User Story #31 for the first Adapter

## Blocked by

- Issue 03 (Real Base model training)
