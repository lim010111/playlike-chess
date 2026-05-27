import type { HistoryEntry } from './hooks/useChessSession'

export function pairSanHistory(history: HistoryEntry[]): string[] {
  const lines: string[] = []
  for (let i = 0; i < history.length; i += 2) {
    const moveNumber = i / 2 + 1
    const white = history[i].san
    const black = history[i + 1]?.san
    lines.push(black ? `${moveNumber}. ${white} ${black}` : `${moveNumber}. ${white}`)
  }
  return lines
}
