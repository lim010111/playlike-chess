import { act, renderHook, waitFor } from '@testing-library/react'
import { Chess } from 'chess.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useChessSession } from './useChessSession'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// White pawn on a7, black pawn on a2 — both sides have non-king material so
// the post-promotion position is NOT insufficient-material terminal. White to
// move can promote on a8 to Q/R/B/N. No checks.
const PRE_PROMOTION_FEN = '4k3/P7/8/8/8/8/p7/4K3 w - - 0 1'

function mockFetchOk(body: unknown): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
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
    expect(result.current.isGameOver).toBe(false)
    expect(result.current.awaiting).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.humanColor).toBe('white')
    expect(result.current.canDrag).toBe(true)
    expect(result.current.pendingPromotion).toBeNull()
  })

  it('applies a user move, POSTs /move, and applies the engine reply', async () => {
    // Engine plays a quiet reply (e7-e5) to the user's e2-e4.
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
    expect(result.current.isGameOver).toBe(false)
  })

  it('shows the promotion picker, applies the chosen piece, and POSTs the post-promotion FEN', async () => {
    const fetchSpy = mockFetchOk({ move_uci: 'e8d8' }) // some legal black king move post-promotion

    const { result } = renderHook(() =>
      useChessSession({ humanColor: 'white', initialFen: PRE_PROMOTION_FEN }),
    )

    // 1. Pawn drop to last rank → picker pending, no fetch yet.
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
    // chess.js itself is NOT mutated until the picker resolves.
    expect(result.current.fen).toBe(PRE_PROMOTION_FEN)

    // 2. User picks knight (under-promotion).
    act(() => {
      result.current.resolvePromotion('n')
    })

    // After resolvePromotion, the move is applied locally and the POST fires.
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))

    // FEN POSTed must reflect the knight promotion.
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    const postedFen = (JSON.parse(init.body as string) as { fen: string }).fen
    const verify = new Chess(PRE_PROMOTION_FEN)
    verify.move({ from: 'a7', to: 'a8', promotion: 'n' })
    expect(postedFen).toBe(verify.fen())
    expect(postedFen).toContain('N3k3') // a8=N, e8=k on rank 8

    await waitFor(() => expect(result.current.awaiting).toBe(false))

    expect(result.current.history.map((h) => h.uci)).toEqual(['a7a8n', 'e8d8'])
    expect(result.current.history[0]?.san).toMatch(/=N/) // SAN includes promotion piece
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

describe("useChessSession ({ humanColor: 'black' })", () => {
  it('throws — engine-moves-first lifecycle ships in Phase 3 / issue #05', () => {
    expect(() => renderHook(() => useChessSession({ humanColor: 'black' }))).toThrow(/Phase 2/)
  })
})
