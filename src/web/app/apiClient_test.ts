import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, postMove } from './apiClient'

describe('postMove', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the parsed move on 200', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ move_uci: 'e2e4' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await postMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')

    expect(result).toEqual({ move_uci: 'e2e4' })
    expect(fetchSpy).toHaveBeenCalledWith(
      '/move',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        }),
      }),
    )
  })

  it('throws an ApiError carrying status and detail on 422', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'invalid FEN: bad' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const err = await postMove('not a fen').then(
      () => null,
      (e: unknown) => e,
    )
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({
      name: 'ApiError',
      status: 422,
      detail: 'invalid FEN: bad',
    })
  })
})
