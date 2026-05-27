import { Chess, type Move, type Square } from 'chess.js'
import { useCallback, useRef, useState } from 'react'
import { ApiError, postMove } from '../apiClient'

export type Color = 'white' | 'black'
export type HistoryEntry = { uci: string; san: string }
export type PendingPromotion = { from: Square; to: Square }
export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

export type TerminalState =
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'threefold-repetition' }
  | { kind: 'fifty-move-rule' }
  | { kind: 'insufficient-material' }

export type PieceDropArgs = {
  sourceSquare: string
  targetSquare: string | null
}

export type ChessSession = {
  fen: string
  history: HistoryEntry[]
  terminal: TerminalState | null
  awaiting: boolean
  error: ApiError | null
  humanColor: Color
  canDrag: boolean
  pendingPromotion: PendingPromotion | null
  onPieceDrop: (args: PieceDropArgs) => boolean
  resolvePromotion: (piece: PromotionPiece) => void
  cancelPromotion: () => void
  resetSession: () => void
}

export type UseChessSessionOptions = {
  humanColor: Color
  // Optional starting FEN — defaults to the chess starting position. Used by
  // tests with pre-promotion / pre-terminal fixtures; production callers leave
  // it unset.
  initialFen?: string
}

// Predicate order matters: chess.js `isDraw()` returns true for stalemate,
// threefold, and insufficient-material as well, so each specific predicate is
// checked first and `isDraw()` is the fifty-move-rule fallback. chess.js v1
// exposes no dedicated fifty-move-only predicate.
function detectTerminal(chess: Chess): TerminalState | null {
  if (chess.isCheckmate()) {
    return { kind: 'checkmate', winner: chess.turn() === 'w' ? 'black' : 'white' }
  }
  if (chess.isStalemate()) return { kind: 'stalemate' }
  if (chess.isThreefoldRepetition()) return { kind: 'threefold-repetition' }
  if (chess.isInsufficientMaterial()) return { kind: 'insufficient-material' }
  if (chess.isDraw()) return { kind: 'fifty-move-rule' }
  return null
}

export function useChessSession(options: UseChessSessionOptions): ChessSession {
  // humanColor='black' deferred to issue #05: engine must move first, board
  // orientation flips, and the color-selection UI ships together as one
  // coherent slice. Guard rather than silently behaving as white.
  if (options.humanColor === 'black') {
    throw new Error(
      "useChessSession: humanColor='black' is not implemented in Phase 2/3 (deferred to issue #05).",
    )
  }

  const chessRef = useRef<Chess>(new Chess(options.initialFen))
  // Monotonic id so a late-arriving /move response from a prior turn (or a
  // prior Session, after resetSession()) cannot overwrite state for the
  // current turn.
  const requestIdRef = useRef(0)

  const [fen, setFen] = useState(chessRef.current.fen())
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [awaiting, setAwaiting] = useState(false)
  const [terminal, setTerminal] = useState<TerminalState | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null)

  const canDrag = !awaiting && terminal === null && pendingPromotion === null

  const requestEngineMove = useCallback(async (currentFen: string) => {
    const id = ++requestIdRef.current
    setAwaiting(true)
    setError(null)

    let response: Awaited<ReturnType<typeof postMove>>
    try {
      response = await postMove(currentFen)
    } catch (e) {
      if (id !== requestIdRef.current) return
      const apiErr = e instanceof ApiError ? e : new ApiError(0, String(e))
      // Invariant 6 (422 defensive): trust local terminal detection. If the
      // user's move was actually terminal, the engine had no legal reply and
      // the right thing is to surface the terminal, not the error.
      const localTerminal = detectTerminal(chessRef.current)
      if (localTerminal) {
        setTerminal(localTerminal)
        setAwaiting(false)
        return
      }
      chessRef.current.undo()
      setFen(chessRef.current.fen())
      setHistory((h) => h.slice(0, -1))
      setError(apiErr)
      setAwaiting(false)
      return
    }
    if (id !== requestIdRef.current) return

    const uci = response.move_uci
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promotion = uci.length === 5 ? uci[4] : undefined

    let mv: Move
    try {
      mv = chessRef.current.move({ from, to, promotion })
    } catch {
      chessRef.current.undo()
      setFen(chessRef.current.fen())
      setHistory((h) => h.slice(0, -1))
      setError(new ApiError(0, `engine returned illegal move "${uci}"`))
      setAwaiting(false)
      return
    }

    setHistory((h) => [...h, { uci, san: mv.san }])
    setFen(chessRef.current.fen())
    setTerminal(detectTerminal(chessRef.current))
    setAwaiting(false)
  }, [])

  const commitUserMove = useCallback(
    (uci: string, mv: Move) => {
      setHistory((h) => [...h, { uci, san: mv.san }])
      const newFen = chessRef.current.fen()
      setFen(newFen)
      // Check terminal BEFORE POSTing. If the user's move ended the Session
      // (checkmate, stalemate, etc.) the engine has no legal reply — POSTing
      // would just earn a 422.
      const localTerminal = detectTerminal(chessRef.current)
      if (localTerminal) {
        setTerminal(localTerminal)
        return
      }
      void requestEngineMove(newFen)
    },
    [requestEngineMove],
  )

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropArgs): boolean => {
      // Sync-reject when locked. react-chessboard also gates drags via
      // allowDragging, but onPieceDrop is the authoritative gate because the
      // user could still drop a piece that started dragging before the lock
      // engaged.
      if (!canDrag || targetSquare === null) return false

      const from = sourceSquare as Square
      const to = targetSquare as Square

      const promotionCandidate = chessRef.current
        .moves({ square: from, verbose: true })
        .find((m) => m.to === to && m.promotion !== undefined)
      if (promotionCandidate) {
        // Hold the move pending the picker. chess.js is NOT mutated yet —
        // cancel just clears the pending state, no undo needed.
        setPendingPromotion({ from, to })
        return false
      }

      let mv: Move
      try {
        mv = chessRef.current.move({ from, to })
      } catch {
        return false
      }
      commitUserMove(`${from}${to}`, mv)
      return true
    },
    [canDrag, commitUserMove],
  )

  const resolvePromotion = useCallback(
    (piece: PromotionPiece) => {
      if (!pendingPromotion) return
      const { from, to } = pendingPromotion
      let mv: Move
      try {
        mv = chessRef.current.move({ from, to, promotion: piece })
      } catch {
        setPendingPromotion(null)
        return
      }
      setPendingPromotion(null)
      commitUserMove(`${from}${to}${piece}`, mv)
    },
    [pendingPromotion, commitUserMove],
  )

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null)
  }, [])

  const resetSession = useCallback(() => {
    // Bump the request id so any /move response still in flight from the
    // prior Session is dropped on arrival by the stale-id guard.
    requestIdRef.current++
    const fresh = new Chess()
    chessRef.current = fresh
    setFen(fresh.fen())
    setHistory([])
    setTerminal(null)
    setPendingPromotion(null)
    setError(null)
    setAwaiting(false)
  }, [])

  return {
    fen,
    history,
    terminal,
    awaiting,
    error,
    humanColor: options.humanColor,
    canDrag,
    pendingPromotion,
    onPieceDrop,
    resolvePromotion,
    cancelPromotion,
    resetSession,
  }
}
