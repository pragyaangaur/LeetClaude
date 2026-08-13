export type Mode = 'classic' | 'bughunt' | 'promptgolf'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface TestCase {
  name: string
  /** JS source run inside the worker. `fn` is the candidate solution, `assert` is available. */
  body: string
  hidden?: boolean
}

export interface Problem {
  id: string
  title: string
  mode: Mode
  difficulty: Difficulty
  tags: string[]
  /** One-line hook shown in the list. */
  blurb: string
  /** Markdown-ish prose (we render a small subset). */
  statement: string
  /** Name of the function the tests will call. */
  entry: string
  starter: string
  tests: TestCase[]
  /** bughunt only: what the "AI" claimed when it produced the starter code. */
  aiClaim?: string
  /** bughunt only: revealed after a correct fix. */
  postmortem?: string
  /** promptgolf only: the contract the generated code must satisfy. */
  contract?: string
}

export type Verdict = 'pass' | 'fail' | 'error' | 'timeout'

export interface TestResult {
  name: string
  hidden: boolean
  verdict: Verdict
  message?: string
  ms: number
}

export interface RunResult {
  results: TestResult[]
  passed: number
  total: number
  ok: boolean
  compileError?: string
}

/** Everything we watch to score judgment rather than just correctness. */
export interface Telemetry {
  startedAt: number
  keystrokes: number
  pastedChars: number
  runs: number
  aiTurns: number
  promptChars: number
  /** true if the last action before submitting was a test run */
  verifiedBeforeSubmit: boolean
  acceptedSuggestions: number
  rejectedSuggestions: number
}

export interface Scorecard {
  correctness: number
  verification: number
  independence: number
  efficiency: number
  overall: number
  notes: string[]
}
