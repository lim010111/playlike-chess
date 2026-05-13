# Full Roster + selector UI

Status: ready-for-agent

## Parent

`.scratch/imitation-engine/PRD.md`

## What to build

Apply the per-Player infrastructure built in issue 04 to the remaining four Roster Players: Hikaru Nakamura, Alireza Firouzja, Fabiano Caruana, Javokhir Sindarov. Each Adapter follows the same protocol (Chess.com PubAPI ingestion, blitz only, LoRA rank 16 on attention QKVO). Add the **Roster manifest** at `src/training/roster.json` listing all five Players with `id`, `display_name`, `chess_com_username`, `time_control`, and a one-line `style_note`. Extend the API with `GET /roster` returning the manifest. Add a UI selector (dropdown or card list) so the user can pick their opponent before starting a Game; selected Player's name and style note are shown during play.

Note: Sindarov ships with whatever data is available — no minimum-volume gate for v1. If his Adapter underperforms on evaluation (issue 07), that is an empirical learning rather than a v1 release blocker.

## Acceptance criteria

- [ ] `src/training/roster.json` exists with 5 entries: Magnus, Hikaru, Firouzja, Caruana, Sindarov — each with id, display_name, chess_com_username, time_control, style_note, snapshot_id
- [ ] Adapters trained for Hikaru, Firouzja, Caruana, Sindarov using the issue-04 pipeline, each pinned to its own `data/snapshots/<player_id>/<fetch-date>/` snapshot per ADR-0002
- [ ] Each Adapter file is < 1 MB; total Adapter assets shipped < 5 MB
- [ ] Inference Engine loads Base + all 5 Adapters at startup
- [ ] `GET /roster` returns the manifest as JSON
- [ ] UI fetches `/roster` on load and renders a Player selector (dropdown or card list)
- [ ] User can pick a Player, start a Game, and the selected `adapter_id` is sent on every `/move` request
- [ ] Selected Player's display name and style note are visible in the UI during the Game
- [ ] Self-play 100 Games per Adapter: 0 illegal Moves across all 5 Adapters
- [ ] Model cards committed at `models/cards/<player_id>.md` for Hikaru, Firouzja, Caruana, Sindarov (same template as the Magnus card from issue 04) — all 5 Roster Players now have one-page model cards per User Story #31

## Blocked by

- Issue 04 (First Adapter end-to-end — Magnus)
