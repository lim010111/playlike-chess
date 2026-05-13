# Split data sources: Lichess for Base, Chess.com for per-Player

The Base model trains on the Lichess Open Database (monthly PGN dumps, filtered to rated blitz games with both players ≥1800 Elo), while per-Player Adapters train on each Player's Chess.com archive fetched via the PubAPI. We deliberately use two sources because the two stages have asymmetric requirements: Base needs millions of games at once, which Lichess provides as bulk downloads but Chess.com PubAPI does not (it is per-user); per-Player needs one named Player's archive, which Chess.com exposes directly but Lichess (where most famous Players are inactive) does not.

Single-source alternatives were rejected: Chess.com-only would require scraping tens of thousands of users' archives to assemble a Base corpus (impractical against PubAPI rate limits), and Lichess-only would lose access to the public archives of the named Players the project's premise depends on. The split adds no meaningful complexity — both sources are PGN — and is reversible per stage if either source becomes unavailable.

## Snapshot freezing

Both data sources are treated as **mutable upstream, frozen at ingest time**. Lichess monthly dumps are intrinsically immutable (`lichess_db_standard_rated_<YYYY-MM>.pgn.zst` is a fixed file once published), so the Lichess snapshot is just the set of months ingested. Chess.com PubAPI is a live endpoint that grows as Players play new Games, so each Player Ingestion run is captured as an explicit snapshot.

For each Roster Player, the Chess.com Player Ingester writes its filtered Position shards under `data/snapshots/<player_id>/<YYYY-MM-DD>/` along with a `manifest.json` recording: fetch date, archive URL list, game count, position count, content hash. The Adapter and its Evaluation report are pinned to a specific snapshot ID. Re-fetching the archive at a later date produces a new snapshot, not an in-place update.

This is the reproducibility contract: any Adapter checkpoint released with v1 can be re-evaluated against its frozen snapshot at any later time and yield the same metrics. The "most recent ~10% hold-out" temporal split is computed against the snapshot, not the live archive — so the split is stable across re-evaluation regardless of how much new gameplay the Player has accumulated upstream.
