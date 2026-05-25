"""FastAPI app for the Playlike Chess engine.

Phase 1 (random-move tracer): exposes POST /move that returns a uniformly
random legal move for the supplied FEN. No ML, no adapters.
"""

from __future__ import annotations

import chess
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict

from playlike_engine.random_move import NoLegalMovesError, pick_random_legal_move

app = FastAPI(title="Playlike Chess Engine", version="0.0.1")

# TODO: load from env at startup; hardcoded for the staging smoke test.
AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"


class MoveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    fen: str


class MoveResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    move_uci: str


@app.post("/move", response_model=MoveResponse)
def move(req: MoveRequest) -> MoveResponse:
    try:
        board = chess.Board(req.fen)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"invalid FEN: {exc}") from exc
    try:
        chosen = pick_random_legal_move(board)
    except NoLegalMovesError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return MoveResponse(move_uci=chosen.uci())
