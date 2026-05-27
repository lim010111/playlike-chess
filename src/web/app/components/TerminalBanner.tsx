import type { TerminalState } from '../hooks/useChessSession'

type Props = {
  terminal: TerminalState
  onNewSession: () => void
}

function label(terminal: TerminalState): string {
  switch (terminal.kind) {
    case 'checkmate':
      return `Checkmate. ${terminal.winner === 'white' ? 'White' : 'Black'} wins.`
    case 'stalemate':
      return 'Draw — stalemate'
    case 'threefold-repetition':
      return 'Draw — threefold repetition'
    case 'fifty-move-rule':
      return 'Draw — 50-move rule'
    case 'insufficient-material':
      return 'Draw — insufficient material'
  }
}

export function TerminalBanner({ terminal, onNewSession }: Props) {
  return (
    <div
      role="status"
      style={{
        marginTop: '0.75rem',
        padding: '0.75rem 1rem',
        background: '#f5f5f5',
        border: '1px solid #ccc',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      <span style={{ fontWeight: 500 }}>{label(terminal)}</span>
      <button
        type="button"
        onClick={onNewSession}
        style={{
          padding: '0.375rem 0.875rem',
          cursor: 'pointer',
          background: '#1f6feb',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          fontSize: '0.875rem',
        }}
      >
        New Session
      </button>
    </div>
  )
}
