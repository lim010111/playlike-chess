# src/engine/_smoke_command_injection.py
# Soft-mode merge-gate smoke; remove before any real merge.
# Refs claude-harness-work#08 AC #5/#6 — deliberately critical pattern
# to verify the gate reports findings without blocking in soft mode.
import os


def run(cmd: str) -> None:
    os.system(cmd)  # critical: command injection on untrusted input


if __name__ == "__main__":
    run(input("cmd> "))
