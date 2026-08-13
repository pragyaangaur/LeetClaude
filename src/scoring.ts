import type { Problem, RunResult, Scorecard, Telemetry } from './types'

export function newTelemetry(): Telemetry {
  return {
    startedAt: Date.now(),
    keystrokes: 0,
    pastedChars: 0,
    runs: 0,
    aiTurns: 0,
    promptChars: 0,
    verifiedBeforeSubmit: false,
    acceptedSuggestions: 0,
    rejectedSuggestions: 0,
  }
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/**
 * The point of the platform: correctness is one axis of four. The rest are the
 * things an interviewer is actually watching once the model is allowed in the room.
 */
export function score(problem: Problem, run: RunResult, t: Telemetry): Scorecard {
  const notes: string[] = []

  const correctness = run.total ? clamp((run.passed / run.total) * 100) : 0
  const hiddenFailures = run.results.filter((r) => r.hidden && r.verdict !== 'pass')
  if (hiddenFailures.length && run.passed > 0) {
    notes.push(
      `${hiddenFailures.length} hidden test${hiddenFailures.length > 1 ? 's' : ''} failed while the visible ones passed — the classic shape of AI-written code that was never adversarially tested.`,
    )
  }

  // Verification: did you run the tests before submitting, and did you iterate?
  let verification = 0
  if (t.verifiedBeforeSubmit) verification += 60
  verification += Math.min(40, t.runs * 12)
  if (!t.verifiedBeforeSubmit) {
    notes.push('You submitted without running the tests first. Shipping unverified model output is the single most expensive habit on this list.')
  } else if (t.runs === 1 && !run.ok) {
    notes.push('One run, then submit. When a test fails, the run before the submit should be the one that passes.')
  }

  // Independence: how much of the code did you type versus paste in wholesale?
  const typed = t.keystrokes
  const pasted = t.pastedChars
  let independence: number
  if (problem.mode === 'promptgolf') {
    independence = 100
  } else if (typed + pasted === 0) {
    independence = 0
  } else {
    independence = clamp((typed / (typed + pasted)) * 100)
    if (pasted > typed * 3 && pasted > 200) {
      notes.push(
        `${Math.round((pasted / (typed + pasted)) * 100)}% of this solution arrived by paste. That is allowed — but if you cannot defend every line of it, you did not solve the problem, you forwarded it.`,
      )
    }
  }

  // Efficiency means different things per mode.
  let efficiency: number
  const minutes = (Date.now() - t.startedAt) / 60000
  if (problem.mode === 'promptgolf') {
    // Under 200 chars is excellent; 800+ is just restating the contract.
    efficiency = clamp(100 - ((t.promptChars - 200) / 600) * 100)
    if (t.promptChars > 700) {
      notes.push('Your prompt is longer than the contract it describes. The skill is finding the smallest sufficient spec, not the safest one.')
    }
  } else {
    efficiency = clamp(100 - ((minutes - 6) / 18) * 100)
  }

  if (t.aiTurns === 0 && problem.mode !== 'promptgolf') {
    notes.push('You never opened the assistant. Worth knowing you can — but the tests do not care either way.')
  }

  const overall = clamp(correctness * 0.5 + verification * 0.2 + independence * 0.15 + efficiency * 0.15)

  return { correctness, verification, independence, efficiency, overall, notes }
}

export function grade(overall: number): string {
  if (overall >= 90) return 'Strong hire'
  if (overall >= 75) return 'Hire'
  if (overall >= 55) return 'Lean hire'
  if (overall >= 35) return 'Mixed'
  return 'No signal yet'
}
