import type { HistoryEntry } from '../hooks/useChessSession'
import { pairSanHistory } from '../moveList'

type Props = { history: HistoryEntry[] }

export function MoveList({ history }: Props) {
  const lines = pairSanHistory(history)
  return (
    <section
      aria-label="Move list"
      style={{
        marginTop: '0.75rem',
        padding: '0.75rem 1rem',
        background: '#fafafa',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '0.875rem',
        maxHeight: 240,
        overflowY: 'auto',
      }}
    >
      <h2
        style={{
          margin: '0 0 0.5rem',
          fontSize: '0.875rem',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Moves
      </h2>
      {lines.length === 0 ? (
        <p style={{ margin: 0, color: '#888', fontFamily: 'system-ui, sans-serif' }}>
          No moves yet.
        </p>
      ) : (
        <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      )}
    </section>
  )
}
