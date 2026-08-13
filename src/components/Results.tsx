import type { RunResult } from '../types'

export function Results({ result, running }: { result: RunResult | null; running: boolean }) {
  if (running) return <div className="results-empty">Running…</div>

  if (!result) {
    return (
      <div className="results-empty">
        Run the tests to see results. The hidden ones only reveal their names once they have had a
        chance to fail.
      </div>
    )
  }

  if (result.compileError) {
    return (
      <div className="results">
        <div className="verdict fail">Did not compile</div>
        <pre className="compile-error">{result.compileError}</pre>
      </div>
    )
  }

  return (
    <div className="results">
      <div className={`verdict ${result.ok ? 'pass' : 'fail'}`}>
        {result.passed} / {result.total} passing
      </div>
      <ul className="test-list">
        {result.results.map((r, i) => (
          <li key={i} className={r.verdict === 'pass' ? 'ok' : 'bad'}>
            <span className="dot" />
            <div>
              <div className="test-name">
                {r.name}
                {r.hidden && <span className="tag">hidden</span>}
              </div>
              {r.message && <div className="test-message">{r.message}</div>}
            </div>
            <span className="ms">{r.ms.toFixed(1)}ms</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
