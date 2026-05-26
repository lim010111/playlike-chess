import { Board } from './components/Board'
import { useChessSession } from './hooks/useChessSession'

export function App() {
  const session = useChessSession({ humanColor: 'white' })
  return (
    <main style={{ maxWidth: 560, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Playlike Chess</h1>
      <Board session={session} />
      {session.error && (
        <p role="alert" style={{ color: '#b00020', marginTop: '0.75rem' }}>
          {session.error.message}
        </p>
      )}
      {session.isGameOver && (
        <p style={{ marginTop: '0.75rem' }}>Game over. (Terminal-state UI lands in Phase 3.)</p>
      )}
    </main>
  )
}
