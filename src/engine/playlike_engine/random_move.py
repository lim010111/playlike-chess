"""Pick a uniformly random legal move from a python-chess Board."""

from __future__ import annotations

import random
import secrets

import chess


class NoLegalMovesError(Exception):
    """Raised when asked to pick a move from a position with no legal moves."""


def pick_random_legal_move(
    board: chess.Board,
    rng: random.Random | None = None,
) -> chess.Move:
    """Return a uniformly random legal move for the side to move.

    Raises NoLegalMovesError if the board has no legal moves (checkmate,
    stalemate, or any other terminal state).
    """
    moves = list(board.legal_moves)
    if not moves:
        raise NoLegalMovesError(f"no legal moves in position: {board.fen()}")
    chooser = rng if rng is not None else secrets
    return chooser.choice(moves)
