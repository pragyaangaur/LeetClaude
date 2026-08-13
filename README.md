# leetclaude

LeetCode assumed you were alone. Interviews and OAs no longer do.

Once the assistant is allowed in the room, recalling a two-pointer trick stops being the
thing under test. What's left is whether you can specify a problem precisely, catch a
confident model being wrong, and tell the difference between code that passes and code
that works. That's what this platform grades.

## Modes

| Mode | The exercise |
| --- | --- |
| **Classic** | An ordinary problem with the assistant open. The tests check the code; the session records how you got there. |
| **Bug Hunt** | You're handed clean, plausible, confidently-described AI-written code that passes every test it shipped with. Find what the hidden tests will find. |
| **Prompt Golf** | The editor is locked. You write only the prompt; a real model writes the code; the tests judge the result. Fewest characters that still passes. |

## The signal report

Submitting returns four axes, not a checkmark:

- **Correctness** — visible *and* hidden tests
- **Verification** — did you run the tests before you claimed it worked
- **Authorship** — how much of the solution you typed versus pasted in whole
- **Efficiency** — time taken, or prompt length in Prompt Golf

## Running it

```bash
npm install && npm run dev
```

Everything works offline except Prompt Golf and the assistant panel, which call the
Anthropic API. Add a key under **Assistant setup**; it's kept in this browser's
localStorage and sent only to `api.anthropic.com`. That's fine for local practice and
is not a pattern to copy into a deployed app — a real deployment proxies through a
server so the key never reaches the client.

## How it works

Candidate code runs in a throwaway Web Worker per run — a fresh thread is what makes the
3-second time limit enforceable, since an infinite loop can only be stopped by
terminating the thread that owns it. Problems are plain data in `src/problems/`; each
test is a source string executed against the candidate's function with a small `assert`
helper, so adding a problem means adding an object, not wiring up a runner.
