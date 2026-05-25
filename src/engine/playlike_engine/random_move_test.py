"""Tests for pick_random_legal_move."""

from __future__ import annotations

import random

import chess
import pytest

from playlike_engine.random_move import NoLegalMovesError, pick_random_legal_move

STARTING_FEN = chess.STARTING_FEN
MID_GAME_FEN = "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4"
# Fool's mate: 1. f3 e5 2. g4 Qh4#. White to move, checkmated, no legal moves.
CHECKMATE_FEN = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3"


def test_seeded_rng_is_deterministic() -> None:
    board = chess.Board(STARTING_FEN)
    rng_a = random.Random(42)
    rng_b = random.Random(42)
    assert pick_random_legal_move(board, rng_a) == pick_random_legal_move(board, rng_b)


def test_returns_legal_move_from_starting_position() -> None:
    board = chess.Board(STARTING_FEN)
    move = pick_random_legal_move(board, random.Random(0))
    assert move in board.legal_moves


def test_returns_legal_move_from_mid_game() -> None:
    board = chess.Board(MID_GAME_FEN)
    move = pick_random_legal_move(board, random.Random(0))
    assert move in board.legal_moves


def test_diversity_across_seeds() -> None:
    board = chess.Board(STARTING_FEN)
    moves = {pick_random_legal_move(board, random.Random(s)) for s in range(30)}
    assert len(moves) > 1


def test_checkmate_position_raises() -> None:
    board = chess.Board(CHECKMATE_FEN)
    assert board.is_checkmate()
    with pytest.raises(NoLegalMovesError):
        pick_random_legal_move(board, random.Random(0))
