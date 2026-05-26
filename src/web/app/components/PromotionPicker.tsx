import type { PromotionPiece } from '../hooks/useChessSession'

const PIECES: { piece: PromotionPiece; label: string; symbol: string }[] = [
  { piece: 'q', label: 'Queen', symbol: '♕' },
  { piece: 'r', label: 'Rook', symbol: '♖' },
  { piece: 'b', label: 'Bishop', symbol: '♗' },
  { piece: 'n', label: 'Knight', symbol: '♘' },
]

type Props = {
  onSelect: (piece: PromotionPiece) => void
  onCancel: () => void
}

export function PromotionPicker({ onSelect, onCancel }: Props) {
  return (
    <div
      role="dialog"
      aria-label="Choose promotion piece"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '1rem 1.25rem',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>Promote pawn to:</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {PIECES.map(({ piece, label, symbol }) => (
            <button
              key={piece}
              type="button"
              onClick={() => onSelect(piece)}
              aria-label={label}
              style={{
                fontSize: '2rem',
                width: '3rem',
                height: '3rem',
                cursor: 'pointer',
                background: '#f5f5f5',
                border: '1px solid #ccc',
                borderRadius: 4,
              }}
            >
              {symbol}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          style={{
            marginTop: '0.75rem',
            padding: '0.25rem 0.75rem',
            cursor: 'pointer',
            background: 'transparent',
            border: '1px solid #999',
            borderRadius: 4,
            fontSize: '0.875rem',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
