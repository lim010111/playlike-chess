import { describe, expect, it } from 'vitest'
import type { HistoryEntry } from './hooks/useChessSession'
import { pairSanHistory } from './moveList'

const entry = (san: string): HistoryEntry => ({ uci: '----', san })

describe('pairSanHistory', () => {
  it('returns [] for empty history', () => {
    expect(pairSanHistory([])).toEqual([])
  })

  it('shows the lone white half-move when black has not replied yet', () => {
    expect(pairSanHistory([entry('e4')])).toEqual(['1. e4'])
  })

  it('pairs a single full move', () => {
    expect(pairSanHistory([entry('e4'), entry('e5')])).toEqual(['1. e4 e5'])
  })

  it('handles odd-length histories with a trailing white half-move', () => {
    expect(pairSanHistory([entry('e4'), entry('e5'), entry('Nf3')])).toEqual(['1. e4 e5', '2. Nf3'])
  })

  it('numbers full moves sequentially across many turns', () => {
    const history = [
      entry('e4'),
      entry('e5'),
      entry('Nf3'),
      entry('Nc6'),
      entry('Bb5'),
      entry('a6'),
    ]
    expect(pairSanHistory(history)).toEqual(['1. e4 e5', '2. Nf3 Nc6', '3. Bb5 a6'])
  })
})
