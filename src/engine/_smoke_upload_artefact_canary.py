"""
SMOKE CANARY — DO NOT MERGE.

Deliberate critical-severity defect to verify the merge-gate pipeline
end-to-end after the Upload review artefact fix (claude-harness-work#21).
Same pattern as the earlier #08 AC #6 smoke (chess_transformer PR #7);
re-used here so the smoke run reproduces a known baseline result
(`critical=1`, validator `uphold`) on top of the artefact upload fix.

Closing the smoke PR without merging cleans this file up.
"""

import os


def run() -> None:
    cmd = input("command: ")
    os.system(cmd)


if __name__ == "__main__":
    run()
