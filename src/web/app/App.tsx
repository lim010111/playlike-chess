import { Board } from './components/Board'
import { MoveList } from './components/MoveList'
import { TerminalBanner } from './components/TerminalBanner'
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
      {session.terminal && (
        <TerminalBanner terminal={session.terminal} onNewSession={session.resetSession} />
      )}
      <MoveList history={session.history} />
    </main>
  )
}
