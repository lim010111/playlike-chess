import { Chess, type Move, type Square } from 'chess.js'
import { useCallback, useRef, useState } from 'react'
import { ApiError, postMove } from '../apiClient'

export type Color = 'white' | 'black'
export type HistoryEntry = { uci: string; san: string }
export type PendingPromotion = { from: Square; to: Square }
export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

export type PieceDropArgs = {
  sourceSquare: string
  targetSquare: string | null
}

export type ChessSession = {
  fen: string
  history: HistoryEntry[]
  isGameOver: boolean
  awaiting: boolean
  error: ApiError | null
  humanColor: Color
  canDrag: boolean
  pendingPromotion: PendingPromotion | null
  onPieceDrop: (args: PieceDropArgs) => boolean
  resolvePromotion: (piece: PromotionPiece) => void
  cancelPromotion: () => void
}

export type UseChessSessionOptions = {
  humanColor: Color
  // Optional starting FEN — defaults to the chess starting position. Used by
  // tests with pre-promotion / pre-terminal fixtures; production callers leave
  // it unset.
  initialFen?: string
}

export function useChessSession(options: UseChessSessionOptions): ChessSession {
  // humanColor='black' deferred to Phase 3 / issue #05: engine must move first,
  // board orientation flips, and the color-selection UI ships together as one
  // coherent slice. Guard rather than silently behaving as white.
  if (options.humanColor === 'black') {
    throw new Error(
      "useChessSession: humanColor='black' is not implemented in Phase 2 (deferred to Phase 3 / issue #05).",
    )
  }

  const chessRef = useRef<Chess>(new Chess(options.initialFen))
  // Monotonic id so a late-arriving /move response from a prior turn cannot
  // overwrite state for the current turn (defensive against any race the input
  // lock might miss; e.g. rollback-then-new-move while the prior request is
  // still in flight).
  const requestIdRef = useRef(0)

  const [fen, setFen] = useState(chessRef.current.fen())
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [awaiting, setAwaiting] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null)

  const canDrag = !awaiting && !isGameOver && pendingPromotion === null

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
      // Invariant 6 (422 defensive): trust local chess.isGameOver(). If the
      // user's move was actually terminal, freeze. Otherwise treat as a
      // genuine failure and roll back (Invariant 5).
      if (chessRef.current.isGameOver()) {
        setIsGameOver(true)
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
    // Invariant 4: re-check terminal state after the engine's reply.
    if (chessRef.current.isGameOver()) setIsGameOver(true)
    setAwaiting(false)
  }, [])

  const commitUserMove = useCallback(
    (uci: string, mv: Move) => {
      setHistory((h) => [...h, { uci, san: mv.san }])
      const newFen = chessRef.current.fen()
      setFen(newFen)
      // Invariant 2: check terminal state BEFORE POST. If the user's move
      // ended the game (checkmate, stalemate, etc.) the engine has no legal
      // reply — POSTing would just earn a 422.
      if (chessRef.current.isGameOver()) {
        setIsGameOver(true)
        return
      }
      void requestEngineMove(newFen)
    },
    [requestEngineMove],
  )

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropArgs): boolean => {
      // Invariant 3: sync-reject when locked. react-chessboard also gates
      // drags via canDragPiece, but onPieceDrop is the authoritative gate
      // because the user could still drop a piece that started dragging
      // before the lock engaged.
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

  return {
    fen,
    history,
    isGameOver,
    awaiting,
    error,
    humanColor: options.humanColor,
    canDrag,
    pendingPromotion,
    onPieceDrop,
    resolvePromotion,
    cancelPromotion,
  }
}
