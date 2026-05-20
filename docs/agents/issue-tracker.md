# Issue tracker: Local Markdown

Issues and PRDs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The PRD is `.scratch/<feature-slug>/PRD.md`
- Implementation issues are `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## Status harness contract

`STATUS.md` at the repo root is regenerated from these issue files by the
status harness (`~/.claude/scripts/status.py`). The harness parses each issue
*structurally* — so the following elements are a contract. Renaming a heading
or changing the bullet shape silently breaks the generated table; nothing
errors.

- **`## Acceptance criteria`** — a section with this exact heading. Every
  `- [ ]` / `- [x]` line under it is one criterion. The harness counts these
  for the progress bar and derives the issue's lifecycle state from them, so
  an issue with no such section shows as `0/0` / `unknown`.
- **`## Blocked by`** — a section with this exact heading. A blocker is a
  bullet that references the blocking issue by number; the harness accepts
  any of `- Issue 03 (Real Base model training)`, `- #03`, and
  `- 03-slug.md`. Prose that is not a bullet ("independent of issues 02-05")
  is ignored, so write each real blocker as its own `-` bullet. Use
  `None — can start immediately.` when there are no blockers.
- **The `<NN>` in the filename** is the issue number the table and "Blocked
  by" references resolve against — not any number written in the body.
- **The `Status:` line** is the triage label (above). Issues triaged
  `wontfix` stay in the table but are excluded from the progress bar.

The `to-issues` skill's issue template already emits the two headings but
leaves the blocker-bullet shape unspecified; the harness therefore accepts
any of the common forms above rather than requiring one exact spelling.

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.
