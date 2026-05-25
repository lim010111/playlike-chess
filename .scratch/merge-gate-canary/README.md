# merge-gate canary suite

Briefs and captured gate output for the canary suite tracked by
`claude-harness-work` issue #09.

## Layout

- `_template.md` — schema every canary brief uses.
- `<NN>.md` — one brief per canary (C1 = `01.md`, etc.).
- `<NN>-artefacts/run-<n>/` — committed snapshot of the gate's
  output for that canary's run number. Contains
  `codex-review.json`, `validators.json`, `validators.md`, and
  `sticky.md` (the PR comment text captured at run time).

## Workflow per canary

1. Branch off latest `main`: `git checkout -b canary/NN-short-name`.
2. Make the one-line defect injection. **Optionally** stage a
   placeholder `<NN>.md` brief on the canary branch (the
   "before-run" sections — path / defect / expected) so the
   commit message can reference the brief by path.
3. `gh pr create --draft --label canary --title "[canary] ..."`
   with body banner `**DO NOT MERGE — merge-gate canary, see
   claude-harness-work#09.**`.
4. Wait for `merge-gate / codex-review` workflow to finish.
5. **Switch back to `main` *before* writing the run record** —
   the brief's filled-in run record and the downloaded artefacts
   are tracked on `main`, never on the canary branch (otherwise
   `gh pr close --delete-branch` aborts on dirty working tree).
   `git checkout main`.
6. `gh run download <id> -D .scratch/merge-gate-canary/<NN>-artefacts/run-1/`
   (flatten the `codex-review/` subdir if `actions/upload-artifact`
   wraps the files).
7. Capture sticky comment text into `run-1/sticky.md`
   (`gh pr view <PR#> --comments > run-1/sticky.md`).
8. Fill in the brief's run record and actual-vs-expected on
   `main` (write the full brief file at
   `.scratch/merge-gate-canary/<NN>.md`).
9. `gh pr close <PR#> --delete-branch` to remove the canary
   PR and its remote branch; `git branch -D canary/NN-...`
   for the local branch.
10. Commit the brief + artefacts on `main`.

## Why canaries are labelled

The `canary` label exists so #10's soft → hard promotion measurement
excludes these PRs from its N=10 real-PR window. The filter is
human-curated for the MVP — when picking PRs to score, ignore any
that carry the label.
