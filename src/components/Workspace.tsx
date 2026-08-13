import { useCallback, useMemo, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import type { Problem, RunResult, Scorecard as Card, Telemetry } from '../types'
import { modeMeta } from '../problems'
import { runTests } from '../runner/run'
import { newTelemetry, score } from '../scoring'
import { estimateTokens, generateSolution, NoKeyError } from '../ai/client'
import { Markdown } from './Markdown'
import { Assistant } from './Assistant'
import { Results } from './Results'
import { Scorecard } from './Scorecard'

interface Props {
  problem: Problem
  onBack: () => void
  onOpenSettings: () => void
  onSolved: (id: string) => void
}

/** A single edit that adds this many characters at once is a paste, not typing. */
const PASTE_THRESHOLD = 24

export function Workspace({ problem, onBack, onOpenSettings, onSolved }: Props) {
  const isGolf = problem.mode === 'promptgolf'

  const [code, setCode] = useState(problem.starter)
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState('')
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [card, setCard] = useState<Card | null>(null)
  const [error, setError] = useState<string | null>(null)

  const telemetry = useRef<Telemetry>(newTelemetry())
  const lastActionWasRun = useRef(false)

  const visibleTests = useMemo(() => problem.tests.filter((t) => !t.hidden), [problem])

  const handleCodeChange = useCallback((value: string) => {
    const delta = value.length - code.length
    if (delta >= PASTE_THRESHOLD) telemetry.current.pastedChars += delta
    else if (delta > 0) telemetry.current.keystrokes += delta
    lastActionWasRun.current = false
    setCode(value)
  }, [code.length])

  async function run(submitting: boolean) {
    const source = isGolf ? generated : code
    if (isGolf && !source) {
      setError('Generate a solution first — in this mode the model writes the code, not you.')
      return
    }

    setRunning(true)
    setError(null)
    const tests = submitting ? problem.tests : visibleTests
    const outcome = await runTests(source, problem.entry, tests)
    setRunning(false)
    telemetry.current.runs += 1

    if (submitting) {
      telemetry.current.verifiedBeforeSubmit = lastActionWasRun.current
      telemetry.current.promptChars = prompt.trim().length
      setResult(outcome)
      const scored = score(problem, outcome, telemetry.current)
      setCard(scored)
      if (outcome.ok) onSolved(problem.id)
    } else {
      lastActionWasRun.current = true
      setResult(outcome)
    }
  }

  async function generate() {
    if (!prompt.trim()) {
      setError('Write a prompt first. That is the whole exercise.')
      return
    }
    telemetry.current.aiTurns += 1
    telemetry.current.promptChars = prompt.trim().length
    setError(null)
    setGenerated('')
    setRunning(true)
    try {
      const source = await generateSolution(prompt, problem.entry, () => {})
      setGenerated(source)
      lastActionWasRun.current = false
    } catch (err) {
      setError(
        err instanceof NoKeyError
          ? 'Prompt Golf needs an API key — the model is the interpreter here.'
          : err instanceof Error
            ? err.message
            : 'Generation failed.',
      )
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="workspace">
      <header className="ws-head">
        <button className="btn ghost" onClick={onBack}>
          ← All problems
        </button>
        <div className="ws-title">
          <span className={`mode-chip ${problem.mode}`}>{modeMeta[problem.mode].label}</span>
          <h1>{problem.title}</h1>
          <span className={`diff ${problem.difficulty}`}>{problem.difficulty}</span>
        </div>
      </header>

      <div className="ws-grid">
        <section className="pane statement">
          <Markdown source={problem.statement} />

          {problem.aiClaim && (
            <div className="ai-claim">
              <div className="ai-claim-label">The model said, when it handed this over</div>
              <p>“{problem.aiClaim}”</p>
            </div>
          )}

          {problem.contract && (
            <>
              <h3 className="md-heading">Contract</h3>
              <pre className="md-code">
                <code>{problem.contract}</code>
              </pre>
            </>
          )}
        </section>

        <section className="pane editor">
          {isGolf ? (
            <div className="golf">
              <label className="field">
                <span>
                  Your prompt
                  <em className="counter">
                    {prompt.trim().length} chars · ≈{estimateTokens(prompt)} tokens
                  </em>
                </span>
                <textarea
                  className="prompt-input"
                  rows={8}
                  value={prompt}
                  placeholder="Describe the function precisely enough that a model gets it right the first time…"
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </label>
              <div className="golf-output">
                <div className="pane-label">What the model wrote</div>
                <pre className="generated">
                  <code>{generated || '— nothing generated yet —'}</code>
                </pre>
              </div>
            </div>
          ) : (
            <CodeMirror
              value={code}
              height="100%"
              theme={oneDark}
              extensions={[javascript()]}
              onChange={handleCodeChange}
              basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
            />
          )}

          <div className="ws-actions">
            {isGolf && (
              <button className="btn" onClick={generate} disabled={running}>
                {running ? 'Generating…' : 'Generate'}
              </button>
            )}
            <button className="btn" onClick={() => run(false)} disabled={running}>
              Run visible tests
            </button>
            <button className="btn primary" onClick={() => run(true)} disabled={running}>
              Submit
            </button>
          </div>
          {error && <div className="notice error">{error}</div>}
        </section>

        <section className="pane side">
          <div className="tabs">
            <div className="pane-label">Tests</div>
          </div>
          <Results result={result} running={running} />

          {!isGolf && (
            <Assistant
              problem={problem}
              code={code}
              onTurn={() => (telemetry.current.aiTurns += 1)}
              onInsert={(snippet) => {
                telemetry.current.pastedChars += snippet.length
                telemetry.current.acceptedSuggestions += 1
                lastActionWasRun.current = false
                setCode(snippet)
              }}
              onOpenSettings={onOpenSettings}
            />
          )}
        </section>
      </div>

      {card && (
        <Scorecard
          card={card}
          problem={problem}
          solved={!!result?.ok}
          onClose={() => setCard(null)}
        />
      )}
    </div>
  )
}
