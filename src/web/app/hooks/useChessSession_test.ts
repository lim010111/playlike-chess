import { act, renderHook, waitFor } from '@testing-library/react'
import { Chess } from 'chess.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useChessSession } from './useChessSession'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// White pawn on a7, black pawn on a2 — both sides have non-king material so
// the post-promotion position is NOT insufficient-material terminal. White to
// move can promote on a8 to Q/R/B/N. No checks.
const PRE_PROMOTION_FEN = '4k3/P7/8/8/8/8/p7/4K3 w - - 0 1'

// Phase 3 fixtures — each one move away from a specific Terminal state.

// White Rd1 + Kh1; black king on g8 boxed by own pawns f7/g7/h7. White plays
// d1d8 → back-rank mate; winner = white.
const PRE_CHECKMATE_FEN = '6k1/5ppp/8/8/8/8/8/3R3K w - - 0 1'

// White Kc6, Qb1; black Ka8. White plays b1b6 → black king has no legal
// move and is not in check → stalemate.
const PRE_STALEMATE_FEN = 'k7/8/2K5/8/8/8/8/1Q6 w - - 0 1'

// White Nb1, Ke1; black Na3, ke6. White plays b1a3 → captures black knight
// leaving K+N vs K → insufficient material.
const PRE_INSUFFICIENT_MATERIAL_FEN = '8/8/4k3/8/8/n7/8/1N2K3 w - - 0 1'

// White Ra1, Ke1; black ke8. Castling disabled. The rook + both kings can
// shuffle along their files without ever capturing or moving a pawn, so the
// position is reproducible after each 4-ply cycle and threefold repetition
// fires after 8 ply (3rd visit of the loaded position).
const PRE_THREEFOLD_FEN = '4k3/8/8/8/8/8/8/R3K3 w - - 0 1'

// White Ka1, Qh1; black ke8. Halfmove clock at 99. White plays h1h2 (quiet,
// non-pawn, non-capture) → clock ticks to 100 → chess.js isDraw() returns
// true with no other specific predicate matching → fifty-move-rule.
const PRE_FIFTY_MOVE_FEN = '4k3/8/8/8/8/8/8/K6Q w - - 99 50'

function mockFetchOk(body: unknown): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function queueFetchOk(spy: ReturnType<typeof vi.spyOn>, body: unknown): void {
  ;(spy as unknown as { mockResolvedValueOnce: (v: Response) => void }).mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe("useChessSession ({ humanColor: 'white' })", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes to the starting position with the user to move', () => {
    const { result } = renderHook(() => useChessSession({ humanColor: 'white' }))

    expect(result.current.fen).toBe(STARTING_FEN)
    expect(result.current.history).toEqual([])
    expect(result.current.terminal).toBeNull()
    expect(result.current.awaiting).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.humanColor).toBe('white')
    expect(result.current.canDrag).toBe(true)
    expect(result.current.pendingPromotion).toBeNull()
  })

  it('applies a user move, POSTs /move, and applies the engine reply', async () => {
    const fetchSpy = mockFetchOk({ move_uci: 'e7e5' })

    const { result } = renderHook(() => useChessSession({ humanColor: 'white' }))

    let dropAccepted = false
    act(() => {
      dropAccepted = result.current.onPieceDrop({
        sourceSquare: 'e2',
        targetSquare: 'e4',
      })
    })
    expect(dropAccepted).toBe(true)

    await waitFor(() => expect(result.current.awaiting).toBe(false))

    const expectedPostFen = new Chess()
    expectedPostFen.move({ from: 'e2', to: 'e4' })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ fen: expectedPostFen.fen() })

    expect(result.current.history.map((h) => h.uci)).toEqual(['e2e4', 'e7e5'])
    expect(result.current.history.map((h) => h.san)).toEqual(['e4', 'e5'])
    expect(result.current.error).toBeNull()
    expect(result.current.terminal).toBeNull()
  })

  it('shows the promotion picker, applies the chosen piece, and POSTs the post-promotion FEN', async () => {
    const fetchSpy = mockFetchOk({ move_uci: 'e8d8' })

    const { result } = renderHook(() =>
      useChessSession({ humanColor: 'white', initialFen: PRE_PROMOTION_FEN }),
    )

    let dropAccepted = false
    act(() => {
      dropAccepted = result.current.onPieceDrop({
        sourceSquare: 'a7',
        targetSquare: 'a8',
      })
    })
    expect(dropAccepted).toBe(false)
    expect(result.current.pendingPromotion).toEqual({ from: 'a7', to: 'a8' })
    expect(result.current.canDrag).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.current.fen).toBe(PRE_PROMOTION_FEN)

    act(() => {
      result.current.resolvePromotion('n')
    })

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    const postedFen = (JSON.parse(init.body as string) as { fen: string }).fen
    const verify = new Chess(PRE_PROMOTION_FEN)
    verify.move({ from: 'a7', to: 'a8', promotion: 'n' })
    expect(postedFen).toBe(verify.fen())
    expect(postedFen).toContain('N3k3')

    await waitFor(() => expect(result.current.awaiting).toBe(false))

    expect(result.current.history.map((h) => h.uci)).toEqual(['a7a8n', 'e8d8'])
    expect(result.current.history[0]?.san).toMatch(/=N/)
    expect(result.current.pendingPromotion).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('cancelPromotion clears the pending picker without POSTing', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { result } = renderHook(() =>
      useChessSession({ humanColor: 'white', initialFen: PRE_PROMOTION_FEN }),
    )

    act(() => {
      result.current.onPieceDrop({ sourceSquare: 'a7', targetSquare: 'a8' })
    })
    expect(result.current.pendingPromotion).not.toBeNull()

    act(() => {
      result.current.cancelPromotion()
    })

    expect(result.current.pendingPromotion).toBeNull()
    expect(result.current.fen).toBe(PRE_PROMOTION_FEN)
    expect(result.current.canDrag).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('useChessSession — Terminal-state detection', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("detects checkmate on the user's mating move (winner = white, no engine call)", () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { result } = renderHook(() =>
      useChessSession({ humanColor: 'white', initialFen: PRE_CHECKMATE_FEN }),
    )

    act(() => {
      result.current.onPieceDrop({ sourceSquare: 'd1', targetSquare: 'd8' })
    })

    expect(result.current.terminal).toEqual({ kind: 'checkmate', winner: 'white' })
    expect(result.current.canDrag).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("detects stalemate after the user's move stalemates the engine", () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { result } = renderHook(() =>
      useChessSession({ humanColor: 'white', initialFen: PRE_STALEMATE_FEN }),
    )

    act(() => {
      result.current.onPieceDrop({ sourceSquare: 'b1', targetSquare: 'b6' })
    })

    expect(result.current.terminal).toEqual({ kind: 'stalemate' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('detects insufficient material after the user captures into K+N vs K', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { result } = renderHook(() =>
      useChessSession({ humanColor: 'white', initialFen: PRE_INSUFFICIENT_MATERIAL_FEN }),
    )

    act(() => {
      result.current.onPieceDrop({ sourceSquare: 'b1', targetSquare: 'a3' })
    })

    expect(result.current.terminal).toEqual({ kind: 'insufficient-material' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('detects the fifty-move rule when a quiet user move ticks the halfmove clock to 100', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { result } = renderHook(() =>
      useChessSession({ humanColor: 'white', initialFen: PRE_FIFTY_MOVE_FEN }),
    )

    act(() => {
      result.current.onPieceDrop({ sourceSquare: 'h1', targetSquare: 'h2' })
    })

    expect(result.current.terminal).toEqual({ kind: 'fifty-move-rule' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('detects threefold repetition after an 8-ply king + rook shuffle', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    // Four engine replies, alternating black-king shuffle.
    queueFetchOk(fetchSpy, { move_uci: 'e8e7' })
    queueFetchOk(fetchSpy, { move_uci: 'e7e8' })
    queueFetchOk(fetchSpy, { move_uci: 'e8e7' })
    queueFetchOk(fetchSpy, { move_uci: 'e7e8' })

    const { result } = renderHook(() =>
      useChessSession({ humanColor: 'white', initialFen: PRE_THREEFOLD_FEN }),
    )

    const userMoves: { from: string; to: string }[] = [
      { from: 'a1', to: 'a2' },
      { from: 'a2', to: 'a1' },
      { from: 'a1', to: 'a2' },
      { from: 'a2', to: 'a1' },
    ]

    for (const mv of userMoves) {
      act(() => {
        result.current.onPieceDrop({ sourceSquare: mv.from, targetSquare: mv.to })
      })
      await waitFor(() => expect(result.current.awaiting).toBe(false))
    }

    expect(fetchSpy).toHaveBeenCalledTimes(4)
    expect(result.current.terminal).toEqual({ kind: 'threefold-repetition' })
  })
})

describe('useChessSession — resetSession', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clears every state slice and returns to the starting position', async () => {
    mockFetchOk({ move_uci: 'e7e5' })

    const { result } = renderHook(() => useChessSession({ humanColor: 'white' }))

    act(() => {
      result.current.onPieceDrop({ sourceSquare: 'e2', targetSquare: 'e4' })
    })
    await waitFor(() => expect(result.current.awaiting).toBe(false))
    expect(result.current.history.length).toBe(2)

    act(() => {
      result.current.resetSession()
    })

    expect(result.current.fen).toBe(STARTING_FEN)
    expect(result.current.history).toEqual([])
    expect(result.current.terminal).toBeNull()
    expect(result.current.pendingPromotion).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.awaiting).toBe(false)
    expect(result.current.canDrag).toBe(true)
  })
})

describe("useChessSession ({ humanColor: 'black' })", () => {
  it('throws — engine-moves-first lifecycle ships in issue #05', () => {
    expect(() => renderHook(() => useChessSession({ humanColor: 'black' }))).toThrow(/issue #05/)
  })
})
