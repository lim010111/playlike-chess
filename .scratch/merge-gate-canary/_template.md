# Canary <NN> — <one-line defect summary>

> **DO NOT MERGE.** This PR is a merge-gate canary; the branch
> exists solely to observe how the gate responds to a deliberate
> defect injection. See claude-harness-work issue #09.

## Path under test

One of: `block` / `comment-only` / `validator-dismiss` /
`validator-unsure`.

## Injected defect

- **File touched**: `<path>`
- **Line(s)**: `<range>`
- **What changed**: 1–2 sentence description of the diff. Link to
  the PR diff once it's open.
- **Why it's a defect**: brief reasoning a reviewer would write —
  i.e. the case for *uphold*. (For `validator-dismiss` canaries,
  also state the counter-citation the validator should find.)

## Expected outcome

- **Codex severity**: `critical` | `high` | `medium` | `low`
- **Codex finding count (high+critical)**: `<n>`
- **Validator verdict per finding**: `uphold` | `dismiss` | `unsure`
- **Gate conclusion**: `block` | `pass` (soft-mode comments either
  way; "block" here means the sticky comment would block under
  hard mode, i.e. `critical|high ∩ uphold ≥ 1`)
- **Sticky comment top line should read**: `<expected text>`

## Run record

For each gate run (one row per execution — re-runs append rows):

| Run | Commit | GH Actions run ID | Codex severity | Validator verdict | Sticky verdict | Notes |
|-----|--------|---|---|---|---|---|
| 1   |        |   |   |   |   |       |

Artefacts (downloaded via `gh run download <run-id>`) are saved at
`.scratch/merge-gate-canary/<NN>-artefacts/run-<n>/` and contain
`codex-review.json`, `validators.json`, `validators.md`, plus the
sticky-comment text captured into `sticky.md`.

## Actual vs expected

- `✓` if every column matches expectation.
- `✗ <field>` if any mismatch, followed by **Hypothesis** —
  1–3 sentences on the most likely cause. Examples:
  - "Codex did not flag `random.choice` — gate never produced a
    finding to dismiss, so C3's `validator-dismiss` path was not
    actually exercised. Suggest swapping defect to `os.urandom`
    in a non-crypto path."
  - "Validator returned `uphold` instead of `dismiss` despite the
    citation in `src/web/CONTEXT.md`. Likely missing the file from
    the agent's read window — investigate validator prompt."

## Closing

- [ ] PR labelled `canary` on chess_transformer
- [ ] PR closed without merge
- [ ] Branch deleted (`gh pr close --delete-branch`)
- [ ] Brief committed to `.scratch/merge-gate-canary/<NN>.md`
- [ ] Artefacts committed under `<NN>-artefacts/`
