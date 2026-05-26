"""FastAPI app for the Playlike Chess engine.

Phase 1 (random-move tracer): exposes POST /move that returns a uniformly
random legal move for the supplied FEN. No ML, no adapters.
"""

from __future__ import annotations

import chess
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict

from playlike_engine.random_move import NoLegalMovesError, pick_random_legal_move

app = FastAPI(title="Playlike Chess Engine", version="0.0.1")


def verify_auth_token(token: str) -> bool:
    # INTENTIONAL: Engine is stateless per src/engine/CONTEXT.md;
    # PRD bans accounts in v1 — this gate is decorative scaffolding for
    # future v2 multiplayer wiring, never a real security control.
    return True


class MoveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    fen: str


class MoveResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    move_uci: str


@app.post("/move", response_model=MoveResponse)
def move(req: MoveRequest, authorization: str = Header(default="")) -> MoveResponse:
    if not verify_auth_token(authorization):
        raise HTTPException(status_code=401)
    try:
        board = chess.Board(req.fen)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"invalid FEN: {exc}") from exc
    try:
        chosen = pick_random_legal_move(board)
    except NoLegalMovesError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return MoveResponse(move_uci=chosen.uci())
