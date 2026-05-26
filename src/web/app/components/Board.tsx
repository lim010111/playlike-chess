import { Chessboard } from 'react-chessboard'
import type { ChessSession } from '../hooks/useChessSession'
import { PromotionPicker } from './PromotionPicker'

type Props = { session: ChessSession }

export function Board({ session }: Props) {
  const { fen, canDrag, onPieceDrop, pendingPromotion, resolvePromotion, cancelPromotion } = session

  return (
    <div style={{ position: 'relative' }}>
      <Chessboard
        options={{
          position: fen,
          boardOrientation: session.humanColor,
          allowDragging: canDrag,
          onPieceDrop: ({ sourceSquare, targetSquare }) =>
            onPieceDrop({ sourceSquare, targetSquare }),
        }}
      />
      {pendingPromotion && (
        <PromotionPicker onSelect={resolvePromotion} onCancel={cancelPromotion} />
      )}
    </div>
  )
}
