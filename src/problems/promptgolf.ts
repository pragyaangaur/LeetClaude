import type { Problem } from '../types'

export const promptGolfProblems: Problem[] = [
  {
    id: 'golf-top-k',
    title: 'Prompt Golf: Top K Frequent Words',
    mode: 'promptgolf',
    difficulty: 'easy',
    tags: ['prompting', 'specification'],
    blurb: 'You may not type code. Only a prompt. Fewest characters that still passes wins.',
    statement: `You cannot edit the solution here. You write the prompt; the model writes the code;
the tests judge the result.

Your prompt must get a model to produce a function that satisfies the contract below.
Every character you type counts against your score, so the game is finding the
*smallest sufficient* specification — cut a word too many and the hidden tests find it.

> The failure mode this trains against is the under-specified ask. Most of the time a
> model gets something wrong, it is because the requirement was never stated, not
> because the model couldn't do it.`,
    contract: `function topKFrequent(words: string[], k: number): string[]

- Returns the k most frequent words, most frequent first.
- Ties are broken alphabetically (ascending).
- Comparison is case-sensitive.
- If k exceeds the number of distinct words, return all of them.`,
    entry: 'topKFrequent',
    starter: '',
    tests: [
      {
        name: 'basic frequency ordering',
        body: `assert.deepEqual(fn(['a','b','a','c','a','b'], 2), ['a','b'])`,
      },
      {
        name: 'alphabetical tie-break',
        body: `assert.deepEqual(fn(['pear','apple','pear','apple','fig'], 2), ['apple','pear'])`,
      },
      {
        name: 'k larger than the vocabulary',
        hidden: true,
        body: `assert.deepEqual(fn(['x','y'], 5), ['x','y'])`,
      },
      {
        name: 'case sensitive',
        hidden: true,
        body: `assert.deepEqual(fn(['Go','go','go','Go','Rust'], 3), ['Go','go','Rust'])`,
      },
      {
        name: 'k = 0',
        hidden: true,
        body: `assert.deepEqual(fn(['a','b'], 0), [])`,
      },
      {
        name: 'empty input',
        hidden: true,
        body: `assert.deepEqual(fn([], 3), [])`,
      },
    ],
  },
  {
    id: 'golf-duration',
    title: 'Prompt Golf: Humanized Duration',
    mode: 'promptgolf',
    difficulty: 'hard',
    tags: ['prompting', 'specification', 'formatting'],
    blurb: 'Formatting rules are where under-specified prompts go to die. Six rules, one prompt.',
    statement: `Same rules: prompt only, no code, fewest characters.

This contract is deliberately fiddly. Formatting is the classic case where a model
produces something *reasonable* that is not what was asked for — and reasonable-but-wrong
is invisible until a hidden test names it.

> Score the tradeoff honestly: restating the entire contract verbatim will pass, and it
> will also score badly. The interesting question is which rules a competent model already
> assumes, and which it has to be told.`,
    contract: `function humanize(ms: number): string

- Units: d, h, m, s — e.g. "1d 4h", "3m 20s".
- At most the two largest non-zero units, joined by a single space.
- Skips zero units entirely: 3600_000 → "1h", not "1h 0m".
- Under one second → "0s".
- Negative input is prefixed with "-": -5000 → "-5s".
- Fractional milliseconds are truncated, not rounded.`,
    entry: 'humanize',
    starter: '',
    tests: [
      {
        name: 'two units',
        body: `assert.equal(fn(100_400_000), '1d 3h')`,
      },
      {
        name: 'minutes and seconds',
        body: `assert.equal(fn(200_000), '3m 20s')`,
      },
      {
        name: 'skips zero units',
        hidden: true,
        body: `assert.equal(fn(3_600_000), '1h')`,
      },
      {
        name: 'sub-second',
        hidden: true,
        body: `assert.equal(fn(400), '0s')`,
      },
      {
        name: 'negative',
        hidden: true,
        body: `assert.equal(fn(-5000), '-5s')`,
      },
      {
        name: 'truncates, never rounds',
        hidden: true,
        body: `assert.equal(fn(1999), '1s')`,
      },
      {
        name: 'at most two units',
        hidden: true,
        body: `assert.equal(fn(93_784_000), '1d 2h')`,
      },
    ],
  },
]
