import type { Problem } from '../types'

export const classicProblems: Problem[] = [
  {
    id: 'merge-intervals',
    title: 'Merge Overlapping Intervals',
    mode: 'classic',
    difficulty: 'easy',
    tags: ['arrays', 'sorting'],
    blurb: 'The warm-up. Ships in every OA. Your AI knows it cold — so does the interviewer.',
    statement: `Given an array of intervals \`[start, end]\`, merge every overlapping pair and return the
result sorted by start.

Intervals that merely touch — \`[1,4]\` and \`[4,5]\` — count as overlapping.

**Signature:** \`mergeIntervals(intervals: number[][]): number[][]\`

> This one is deliberately easy. It is here so you can feel the difference between
> a problem the model has memorised and the ones that follow.`,
    entry: 'mergeIntervals',
    starter: `function mergeIntervals(intervals) {
  // your code here
}
`,
    tests: [
      {
        name: 'merges a simple overlap',
        body: `assert.deepEqual(fn([[1,3],[2,6],[8,10]]), [[1,6],[8,10]])`,
      },
      {
        name: 'treats touching intervals as overlapping',
        body: `assert.deepEqual(fn([[1,4],[4,5]]), [[1,5]])`,
      },
      {
        name: 'handles unsorted input',
        body: `assert.deepEqual(fn([[8,10],[1,3],[2,6],[15,18]]), [[1,6],[8,10],[15,18]])`,
      },
      {
        name: 'empty input',
        hidden: true,
        body: `assert.deepEqual(fn([]), [])`,
      },
      {
        name: 'one interval swallows the rest',
        hidden: true,
        body: `assert.deepEqual(fn([[1,100],[5,9],[20,30]]), [[1,100]])`,
      },
      {
        name: 'does not mutate the caller’s array',
        hidden: true,
        body: `const input = [[3,4],[1,2]];
const snapshot = JSON.stringify(input);
fn(input);
assert.equal(JSON.stringify(input), snapshot, 'input array was mutated');`,
      },
    ],
  },
  {
    id: 'sliding-window-limiter',
    title: 'Sliding Window Rate Limiter',
    mode: 'classic',
    difficulty: 'medium',
    tags: ['design', 'time', 'systems'],
    blurb: 'Ask the model for a rate limiter and you get a fixed window. The tests want a sliding one.',
    statement: `Build a rate limiter that allows at most \`limit\` requests per key in any rolling
\`windowMs\` millisecond window.

\`\`\`js
const allow = createLimiter({ limit: 3, windowMs: 1000 })
allow('user-1', 0)    // true
allow('user-1', 100)  // true
allow('user-1', 200)  // true
allow('user-1', 900)  // false  — 3 already in the last 1000ms
allow('user-1', 1100) // true   — the 0ms request has aged out
\`\`\`

Time is passed in explicitly so the behaviour is deterministic. Requests that are
denied do **not** consume quota. Keys are independent.

**Signature:** \`createLimiter({ limit, windowMs }): (key: string, now: number) => boolean\`

> A *fixed* window resets on a clock boundary and will happily let \`2 * limit\`
> requests through across a boundary. That is the default answer you will be handed.`,
    entry: 'createLimiter',
    starter: `function createLimiter({ limit, windowMs }) {
  // return a function (key, now) => boolean
}
`,
    tests: [
      {
        name: 'allows up to the limit',
        body: `const allow = fn({ limit: 3, windowMs: 1000 });
assert.equal(allow('a', 0), true);
assert.equal(allow('a', 100), true);
assert.equal(allow('a', 200), true);`,
      },
      {
        name: 'denies past the limit',
        body: `const allow = fn({ limit: 3, windowMs: 1000 });
[0, 100, 200].forEach(t => allow('a', t));
assert.equal(allow('a', 900), false);`,
      },
      {
        name: 'recovers as requests age out',
        body: `const allow = fn({ limit: 3, windowMs: 1000 });
[0, 100, 200].forEach(t => allow('a', t));
assert.equal(allow('a', 1100), true);`,
      },
      {
        name: 'keys are independent',
        hidden: true,
        body: `const allow = fn({ limit: 1, windowMs: 1000 });
assert.equal(allow('a', 0), true);
assert.equal(allow('b', 0), true);
assert.equal(allow('a', 1), false);`,
      },
      {
        name: 'no fixed-window burst across a boundary',
        hidden: true,
        body: `const allow = fn({ limit: 5, windowMs: 1000 });
// 5 requests at the tail of the first second
[960, 970, 980, 990, 999].forEach(t => assert.equal(allow('a', t), true));
// a fixed-window impl resets at 1000 and lets all 5 of these through
const admitted = [1000, 1010, 1020, 1030, 1040].filter(t => allow('a', t)).length;
assert.equal(admitted, 0, 'looks like a fixed window: ' + admitted + ' extra requests admitted');`,
      },
      {
        name: 'denied requests do not consume quota',
        hidden: true,
        body: `const allow = fn({ limit: 2, windowMs: 1000 });
allow('a', 0); allow('a', 10);
assert.equal(allow('a', 20), false);
assert.equal(allow('a', 30), false);
// once the first two age out, the window must be clear
assert.equal(allow('a', 1011), true);
assert.equal(allow('a', 1012), true);
assert.equal(allow('a', 1013), false);`,
      },
    ],
  },
]
