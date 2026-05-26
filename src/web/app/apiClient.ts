export type MoveResponse = { move_uci: string }

export class ApiError extends Error {
  readonly status: number
  readonly detail: string | undefined

  constructor(status: number, message: string, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export async function postMove(fen: string): Promise<MoveResponse> {
  let res: Response
  try {
    res = await fetch('/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fen }),
    })
  } catch (cause) {
    throw new ApiError(0, 'network error', String(cause))
  }

  if (!res.ok) {
    let detail: string | undefined
    try {
      const body = (await res.json()) as { detail?: unknown }
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      // body was not JSON; leave detail undefined
    }
    throw new ApiError(res.status, `POST /move failed (${res.status})`, detail)
  }

  return (await res.json()) as MoveResponse
}
