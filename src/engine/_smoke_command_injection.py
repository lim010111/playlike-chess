# DO NOT MERGE — deliberate critical-severity canary for the merge-gate smoke
# test (claude-harness-work#08 AC #6).
#
# The pattern below (raw user input piped to os.system) is a textbook
# command-injection vulnerability and should be detected by the Codex
# adversarial reviewer as a critical finding. If this PR merges, REVERT IT.
import os


def smoke_command_injection() -> None:
    cmd = input("cmd: ")
    os.system(cmd)
