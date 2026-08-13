import type { Problem } from '../types'

export const bughuntProblems: Problem[] = [
  {
    id: 'lru-recency',
    title: 'The LRU That Isn’t',
    mode: 'bughunt',
    difficulty: 'easy',
    tags: ['cache', 'review', 'data-structures'],
    blurb: 'Clean, idiomatic, well-commented, O(1), and quietly evicting the wrong key.',
    aiClaim:
      'Here’s an O(1) LRU cache using a Map, which preserves insertion order so the least recently used key is always first. I’ve verified the eviction logic.',
    statement: `The code below arrived from a model. It reads well, the complexity claim is
correct, and it passes the tests you were given.

It is still wrong. Find the defect, fix it, and make the hidden tests pass.

**Contract:** \`createLRU(capacity)\` returns \`{ get, set, size }\`. Reading a key with
\`get\` counts as *using* it. When the cache is full, the key that was used least
recently is evicted.

> The skill under test is review, not recall. Read it as if you have to sign off on it.`,
    entry: 'createLRU',
    starter: `function createLRU(capacity) {
  // A Map iterates in insertion order, so the first key is the oldest.
  const map = new Map()

  return {
    get(key) {
      if (!map.has(key)) return undefined
      return map.get(key)
    },

    set(key, value) {
      if (map.has(key)) {
        // Re-insert so this key moves to the back of the order.
        map.delete(key)
      } else if (map.size >= capacity) {
        const oldest = map.keys().next().value
        map.delete(oldest)
      }
      map.set(key, value)
    },

    get size() {
      return map.size
    },
  }
}
`,
    postmortem: `\`get\` never touched the ordering. The cache tracked *least recently written*,
not *least recently used* — so a hot key that is read constantly but written once
gets evicted while a cold key that was written later survives.

This is the shape of defect that survives review: the claim ("O(1)", "Map preserves
insertion order") is true, the code is clean, and the name of the thing is the only
place the requirement lives. Under a read-heavy load it degrades your hit rate
without ever throwing.`,
    tests: [
      {
        name: 'stores and reads back',
        body: `const c = fn(2);
c.set('a', 1);
assert.equal(c.get('a'), 1);
assert.equal(c.get('nope'), undefined);`,
      },
      {
        name: 'evicts when over capacity',
        body: `const c = fn(2);
c.set('a', 1); c.set('b', 2); c.set('c', 3);
assert.equal(c.size, 2);
assert.equal(c.get('a'), undefined);`,
      },
      {
        name: 'writing an existing key refreshes it',
        body: `const c = fn(2);
c.set('a', 1); c.set('b', 2); c.set('a', 9); c.set('c', 3);
assert.equal(c.get('a'), 9);
assert.equal(c.get('b'), undefined);`,
      },
      {
        name: 'reading a key protects it from eviction',
        hidden: true,
        body: `const c = fn(2);
c.set('a', 1); c.set('b', 2);
c.get('a');            // 'a' is now the most recently used
c.set('c', 3);         // must evict 'b'
assert.equal(c.get('a'), 1, "'a' was read but got evicted anyway");
assert.equal(c.get('b'), undefined, "'b' should have been evicted");`,
      },
      {
        name: 'a repeatedly read key survives many writes',
        hidden: true,
        body: `const c = fn(3);
c.set('hot', 1); c.set('x', 0); c.set('y', 0);
for (let i = 0; i < 20; i++) { c.get('hot'); c.set('k' + i, i); }
assert.equal(c.get('hot'), 1, 'the hottest key in the cache was evicted');`,
      },
      {
        name: 'capacity of 1',
        hidden: true,
        body: `const c = fn(1);
c.set('a', 1); c.get('a'); c.set('b', 2);
assert.equal(c.size, 1);
assert.equal(c.get('a'), undefined);
assert.equal(c.get('b'), 2);`,
      },
    ],
  },
  {
    id: 'csv-quotes',
    title: 'Parse This CSV Line',
    mode: 'bughunt',
    difficulty: 'medium',
    tags: ['parsing', 'review', 'strings'],
    blurb: 'It handles quoted commas. It was never asked about quoted quotes.',
    aiClaim:
      'This handles the tricky case — commas inside quoted fields. It’s a single pass, O(n), no regex, no dependencies.',
    statement: `Split one line of CSV into fields.

Rules, per RFC 4180:
- Fields are separated by commas.
- A field may be wrapped in double quotes; a comma inside quotes is literal.
- Inside a quoted field, \`""\` is an escaped literal \`"\`.
- Empty fields are preserved, including a trailing one.

\`\`\`js
parseCsvLine('a,b,c')            // ['a', 'b', 'c']
parseCsvLine('a,"b,c",d')        // ['a', 'b,c', 'd']
parseCsvLine('"say ""hi"""')     // ['say "hi"']
\`\`\`

**Signature:** \`parseCsvLine(line: string): string[]\`

> The given tests cover the case the model was thinking about. The hidden ones cover
> the case it wasn't.`,
    entry: 'parseCsvLine',
    starter: `function parseCsvLine(line) {
  const out = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (ch === '"') {
      // Toggle quote mode — the quote itself is never part of the value.
      inQuotes = !inQuotes
      continue
    }

    if (ch === ',' && !inQuotes) {
      out.push(field)
      field = ''
      continue
    }

    field += ch
  }

  out.push(field)
  return out
}
`,
    postmortem: `Toggling on every quote silently collapses \`""\` into nothing. \`"say ""hi"""\`
parses as \`say hi\` — no error, no crash, just a field that is quietly wrong in a
way that survives all the way into your database.

The tests you were handed were written from the same mental model as the code:
both were thinking about *commas inside quotes*. Tests generated alongside an
implementation inherit its blind spots, which is exactly why the interesting half
of the suite is the half you didn't write.`,
    tests: [
      {
        name: 'plain fields',
        body: `assert.deepEqual(fn('a,b,c'), ['a','b','c'])`,
      },
      {
        name: 'comma inside quotes',
        body: `assert.deepEqual(fn('a,"b,c",d'), ['a','b,c','d'])`,
      },
      {
        name: 'empty fields are preserved',
        body: `assert.deepEqual(fn('a,,c'), ['a','','c'])`,
      },
      {
        name: 'escaped quotes become one literal quote',
        hidden: true,
        body: `assert.deepEqual(fn('"say ""hi"""'), ['say "hi"'])`,
      },
      {
        name: 'escaped quotes inside a quoted field',
        hidden: true,
        body: `assert.deepEqual(fn('"she said ""go"", loudly",next'), ['she said "go", loudly','next'])`,
      },
      {
        name: 'trailing empty field',
        hidden: true,
        body: `assert.deepEqual(fn('a,b,'), ['a','b',''])`,
      },
      {
        name: 'a quoted empty field',
        hidden: true,
        body: `assert.deepEqual(fn('a,"",b'), ['a','','b'])`,
      },
    ],
  },
  {
    id: 'retry-backoff',
    title: 'Retry With Backoff, Off By One',
    mode: 'bughunt',
    difficulty: 'medium',
    tags: ['async', 'review', 'resilience'],
    blurb: 'Does `retries: 3` mean three attempts or four? The code and the docstring disagree.',
    aiClaim:
      'Standard exponential backoff with a configurable retry count. Delays double each time: 100ms, 200ms, 400ms.',
    statement: `\`retryWithBackoff(task, { retries, baseMs, sleep })\` calls \`task(attemptIndex)\`
and returns its result.

- \`retries\` is the number of **additional** attempts after the first one. So
  \`retries: 2\` means up to **3** calls to \`task\`.
- Before retry *k* (1-indexed) it awaits \`sleep(baseMs * 2 ** (k - 1))\` → 100, 200, 400…
- After the final failed attempt it does **not** sleep. It rejects with the last error.
- \`sleep\` is injected so the tests stay deterministic.

**Signature:** \`async retryWithBackoff(task, { retries, baseMs, sleep }): Promise<T>\`

> Both defects here are the kind that only show up under the failure conditions the
> function exists to handle — which is to say, in production, at 3am.`,
    entry: 'retryWithBackoff',
    starter: `async function retryWithBackoff(task, { retries = 3, baseMs = 100, sleep }) {
  let lastError

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await task(attempt)
    } catch (err) {
      lastError = err
      await sleep(baseMs * Math.pow(2, attempt))
    }
  }

  throw lastError
}
`,
    postmortem: `Two defects, both off by one.

The loop runs \`retries\` times, so \`retries: 2\` gives you two attempts, not three —
you silently get one fewer shot at recovery than you configured. And it sleeps after
the *final* failure, so every exhausted retry chain pays one last pointless delay
before it gives up. Under load that delay is multiplied across every failing request.

Neither shows up in the happy path. Both need a test that fails on purpose.`,
    tests: [
      {
        name: 'returns immediately when the task succeeds',
        body: `let calls = 0; const sleeps = [];
const out = await fn(async () => { calls++; return 'ok' }, { retries: 3, baseMs: 100, sleep: async ms => sleeps.push(ms) });
assert.equal(out, 'ok');
assert.equal(calls, 1);
assert.deepEqual(sleeps, []);`,
      },
      {
        name: 'retries once with a 100ms delay',
        body: `let calls = 0; const sleeps = [];
const out = await fn(async () => { calls++; if (calls < 2) throw new Error('boom'); return 'ok' },
  { retries: 3, baseMs: 100, sleep: async ms => sleeps.push(ms) });
assert.equal(out, 'ok');
assert.equal(calls, 2);
assert.deepEqual(sleeps, [100]);`,
      },
      {
        name: 'passes the attempt index to the task',
        body: `const seen = [];
await fn(async i => { seen.push(i); if (seen.length < 3) throw new Error('x'); return 1 },
  { retries: 5, baseMs: 100, sleep: async () => {} });
assert.deepEqual(seen, [0, 1, 2]);`,
      },
      {
        name: 'retries:2 means three attempts',
        hidden: true,
        body: `let calls = 0;
const out = await fn(async () => { calls++; if (calls < 3) throw new Error('boom'); return 'ok' },
  { retries: 2, baseMs: 100, sleep: async () => {} });
assert.equal(out, 'ok', 'gave up before using every configured retry');
assert.equal(calls, 3, 'expected 3 attempts for retries:2, got ' + calls);`,
      },
      {
        name: 'no sleep after the final failure',
        hidden: true,
        body: `const sleeps = [];
let threw = false;
try {
  await fn(async () => { throw new Error('always') },
    { retries: 2, baseMs: 100, sleep: async ms => sleeps.push(ms) });
} catch (e) { threw = true; assert.equal(e.message, 'always'); }
assert.ok(threw, 'should reject once retries are exhausted');
assert.deepEqual(sleeps, [100, 200], 'slept ' + sleeps.length + ' times for 2 retries');`,
      },
      {
        name: 'retries:0 attempts exactly once and never sleeps',
        hidden: true,
        body: `let calls = 0; const sleeps = [];
let threw = false;
try {
  await fn(async () => { calls++; throw new Error('nope') },
    { retries: 0, baseMs: 100, sleep: async ms => sleeps.push(ms) });
} catch { threw = true }
assert.ok(threw);
assert.equal(calls, 1, 'retries:0 should still make the initial attempt');
assert.deepEqual(sleeps, []);`,
      },
    ],
  },
]
