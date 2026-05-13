# Project named Playlike Chess; Engine reserved for runtime module

The project is named **Playlike Chess** (slug `playlike-chess`). The name lives in the repo identifier, the PRD header, this ADR set, and the README — never in user-facing UI copy, which exposes only Opponent names ("Playing against: Magnus Carlsen") per PRD User Story #8.

The earlier working name "Imitation Engine" — surfaced in `.scratch/imitation-engine/PRD.md` v1 header and the seven tracer-bullet issue files — is retired. The rename collapses a glossary collision: `src/engine/CONTEXT.md` defines **Inference Engine** as the runtime module that wraps the Base model and all Roster Adapters, and `CONTEXT-MAP.md` already labels one of the three contexts simply "Engine". A project named "Imitation Engine" would force every future reference to disambiguate "project-level Engine" vs "module-level Engine" — exactly the kind of two-meanings-one-word problem the per-context glossaries' `_Avoid_` patterns are designed to prevent.

The name **Playlike Chess** foregrounds the project's thesis as stated in the PRD Problem Statement: a chess engine "that lets the user pick a Player from a closed roster and play a complete game against an Adapter trained to imitate that Player's blitz move distribution". "Playlike" is the one-word form of "play like Magnus" / "play like Hikaru". The `-chess` suffix in the slug keeps the GitHub URL self-explanatory to portfolio-link skimmers without dragging the name into the UI.

Alternatives considered and rejected:

- **`imitation-chess`** — minimum-change variant of `imitation-engine`. Rejected because "imitation" overlaps with the imitation-learning subfield in robotics/ML, diluting identification when the name appears in a portfolio URL.
- **`chess-understudy`** — theatrical metaphor (an understudy is a trained performer who plays someone else's role). The metaphor maps onto the Adapter definition cleanly, but reads as more evocative than the documentation tone elsewhere in this repo; chose literal over evocative.
- **Keeping "Imitation Engine"** — rejected per the glossary-collision argument above. Renaming the `src/engine/` module instead (to free `Engine` for the project) was considered and rejected: `Engine` is already structural in the codebase (a directory, a per-context `CONTEXT.md`, multiple references across ADR-0001 and ADR-0002), so moving the rename cost to the module would be larger than moving it to the still-malleable project name.
