"""HTTP tests for POST /move."""

from __future__ import annotations

import chess
import pytest
from fastapi.testclient import TestClient

from playlike_engine.api import app

STARTING_FEN = chess.STARTING_FEN
MID_GAME_FEN = "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4"
CHECKMATE_FEN = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3"
INVALID_FEN_STR = "not a fen"


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


def test_starting_position_returns_legal_uci(client: TestClient) -> None:
    response = client.post("/move", json={"position": STARTING_FEN})
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"move_uci"}
    board = chess.Board(STARTING_FEN)
    assert chess.Move.from_uci(body["move_uci"]) in board.legal_moves


def test_mid_game_returns_legal_uci(client: TestClient) -> None:
    response = client.post("/move", json={"position": MID_GAME_FEN})
    assert response.status_code == 200
    board = chess.Board(MID_GAME_FEN)
    assert chess.Move.from_uci(response.json()["move_uci"]) in board.legal_moves


def test_invalid_fen_returns_422(client: TestClient) -> None:
    response = client.post("/move", json={"position": INVALID_FEN_STR})
    assert response.status_code == 422


def test_checkmate_fen_returns_422(client: TestClient) -> None:
    response = client.post("/move", json={"position": CHECKMATE_FEN})
    assert response.status_code == 422


def test_extra_field_rejected_by_strict_schema(client: TestClient) -> None:
    response = client.post(
        "/move",
        json={"position": STARTING_FEN, "adapter_id": "magnus"},
    )
    assert response.status_code == 422
