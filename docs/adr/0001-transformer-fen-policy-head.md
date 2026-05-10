# Transformer over FEN tokens with policy head over fixed action space

We chose a Transformer that takes the FEN string as tokenized text input and outputs logits over a fixed action space (~1968 UCI move encodings), rather than an LLM-style decoder over move-sequence tokens (α) or an AlphaZero-style ResNet over an 8×8×channels board tensor (β). This keeps the board state explicit (avoiding the implicit-board, long-context problem of (α)), makes illegal-move masking a one-line operation at the policy head, and aligns with LLM tooling for LoRA-based per-player adapters — strengths the other two options each lack.

DeepMind's 2024 "Grandmaster-Level Chess Without Search" (Ruoss et al.) demonstrates this approach reaching ~2300 Elo on Lichess blitz at 9M parameters, which fits the 3080 10GB compute budget and the project's (C)-grade usable-tool target.
