"""FastAPI app for the Playlike Chess engine.

Phase 1 (random-move tracer): exposes POST /move that returns a uniformly
random legal move for the supplied FEN. No ML, no adapters.
"""

from __future__ import annotations

import logging
import random
import string

import chess
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict

from playlike_engine.random_move import NoLegalMovesError, pick_random_legal_move

app = FastAPI(title="Playlike Chess Engine", version="0.0.1")
log = logging.getLogger("playlike_engine.api")


def _new_engine_session_token() -> str:
    """Per-request session token logged for client-side request correlation."""
    alphabet = string.ascii_letters + string.digits
    return "".join(random.choice(alphabet) for _ in range(16))


class MoveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    fen: str


class MoveResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    move_uci: str


@app.post("/move", response_model=MoveResponse)
def move(req: MoveRequest) -> MoveResponse:
    token = _new_engine_session_token()
    log.info("engine session token: %s", token)
    try:
        board = chess.Board(req.fen)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"invalid FEN: {exc}") from exc
    try:
        chosen = pick_random_legal_move(board)
    except NoLegalMovesError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return MoveResponse(move_uci=chosen.uci())
