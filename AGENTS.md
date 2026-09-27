# leetclaude

Context for anyone, human or AI, picking this up cold. Written 4 September 2026.

## What it is

A practice platform for coding interviews in a world where the assistant is allowed in the room. LeetCode assumed you were alone; interviews and online assessments no longer do. Once the model is present, recalling a two-pointer trick stops being the thing under test. What is left is whether you can specify a problem precisely, catch a confident model being wrong, and tell the difference between code that passes and code that works. That is what this grades.

- Repo: https://github.com/pragyaangaur/LeetClaude
- Stack: React and TypeScript on Vite, with oxlint

## Status

Shipped as a single commit, `b09c8cb The death of DSA at last`, on 13 August 2026. Nothing is in progress and the tree is clean. `dist/` is built locally and is not tracked in git. There is no live deployment.

Because there is one commit, the git history tells you nothing about how it evolved. This file and the README are the record.

## The three modes

| Mode | The exercise |
| --- | --- |
| Classic | An ordinary problem with the assistant open. The tests check the code; the session records how you got there. |
| Bug Hunt | You are handed clean, plausible, confidently described AI-written code that passes every test it shipped with. Find what the hidden tests will find. |
| Prompt Golf | The editor is locked. You write only the prompt, a real model writes the code, and the tests judge the result. Fewest characters that still passes. |

## The signal report

Submitting returns four axes rather than a checkmark, and this is the point of the project:

- **Correctness**, visible and hidden tests
- **Verification**, did you run the tests before claiming it worked
- **Authorship**, how much you typed versus pasted in whole
- **Efficiency**, time taken, or prompt length in Prompt Golf

## Layout

```
src/problems/     classic.ts, bughunt.ts, promptgolf.ts, index.ts
src/runner/       run.ts and worker.ts, the sandbox
src/components/   Home, Workspace, Assistant, Results, Scorecard, Settings, Markdown
src/ai/client.ts  the Anthropic API client
src/scoring.ts    the four axes
src/types.ts, src/App.tsx, src/main.tsx
```

## Two design decisions worth keeping

- **Candidate code runs in a throwaway Web Worker per run.** A fresh thread is what makes the three second time limit enforceable, because an infinite loop can only be stopped by terminating the thread that owns it.
- **Problems are plain data.** Each test is a source string executed against the candidate's function with a small `assert` helper, so adding a problem means adding an object, not wiring up a runner.

## The API key caveat

Everything works offline except Prompt Golf and the assistant panel, which call the Anthropic API directly from the browser. The key lives in localStorage and goes only to `api.anthropic.com`. That is fine for local practice and **is deliberately not a pattern to copy into a deployed app**. A real deployment proxies through a server so the key never reaches the client. The README says this and it should keep saying it.

## Running it

```bash
npm install && npm run dev
```
