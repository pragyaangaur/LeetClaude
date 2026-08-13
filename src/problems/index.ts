import type { Mode, Problem } from '../types'
import { classicProblems } from './classic'
import { bughuntProblems } from './bughunt'
import { promptGolfProblems } from './promptgolf'

export const problems: Problem[] = [
  ...classicProblems,
  ...bughuntProblems,
  ...promptGolfProblems,
]

export const modeMeta: Record<Mode, { label: string; tagline: string; blurb: string }> = {
  classic: {
    label: 'Classic',
    tagline: 'Solve it. The assistant is open.',
    blurb:
      'The problem you expect, under the conditions you actually work in. The tests check the code; the session checks how you got there.',
  },
  bughunt: {
    label: 'Bug Hunt',
    tagline: 'The code is written. It is also wrong.',
    blurb:
      'You are handed a confident, clean, plausible solution that passes the tests it came with. Find what the hidden tests will find.',
  },
  promptgolf: {
    label: 'Prompt Golf',
    tagline: 'No code. Just the ask.',
    blurb:
      'The editor is locked. Specify the problem well enough that a model gets it right first try — in as few characters as possible.',
  },
}

export function getProblem(id: string): Problem | undefined {
  return problems.find((p) => p.id === id)
}
