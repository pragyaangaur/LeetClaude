/// <reference lib="webworker" />
import type { TestCase, TestResult } from '../types'

interface RunMessage {
  code: string
  entry: string
  tests: TestCase[]
}

const assert = {
  ok(cond: unknown, msg?: string) {
    if (!cond) throw new Error(msg ?? 'expected value to be truthy')
  },
  equal(actual: unknown, expected: unknown, msg?: string) {
    if (!Object.is(actual, expected)) {
      throw new Error(msg ?? `expected ${fmt(expected)} but got ${fmt(actual)}`)
    }
  },
  deepEqual(actual: unknown, expected: unknown, msg?: string) {
    const a = JSON.stringify(actual)
    const b = JSON.stringify(expected)
    if (a !== b) throw new Error(msg ?? `expected ${b} but got ${a}`)
  },
  throws(fn: () => unknown, msg?: string) {
    try {
      fn()
    } catch {
      return
    }
    throw new Error(msg ?? 'expected function to throw')
  },
}

function fmt(v: unknown): string {
  if (typeof v === 'string') return JSON.stringify(v)
  if (typeof v === 'bigint') return `${v}n`
  try {
    return JSON.stringify(v) ?? String(v)
  } catch {
    return String(v)
  }
}

self.onmessage = async (e: MessageEvent<RunMessage>) => {
  const { code, entry, tests } = e.data
  let fn: unknown

  try {
    // Build the candidate in an isolated function scope, then hand back the entry symbol.
    const factory = new Function(
      `"use strict";\n${code}\n;return typeof ${entry} !== "undefined" ? ${entry} : undefined;`,
    )
    fn = factory()
  } catch (err) {
    post({
      results: [],
      passed: 0,
      total: tests.length,
      ok: false,
      compileError: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    })
    return
  }

  if (typeof fn !== 'function') {
    post({
      results: [],
      passed: 0,
      total: tests.length,
      ok: false,
      compileError: `No function named \`${entry}\` was defined. The tests call \`${entry}(...)\`.`,
    })
    return
  }

  const results: TestResult[] = []
  for (const test of tests) {
    const started = performance.now()
    try {
      const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
      const run = new AsyncFunction('fn', 'assert', `"use strict";\n${test.body}`)
      await run(fn, assert)
      results.push({
        name: test.name,
        hidden: !!test.hidden,
        verdict: 'pass',
        ms: performance.now() - started,
      })
    } catch (err) {
      results.push({
        name: test.name,
        hidden: !!test.hidden,
        verdict: 'fail',
        message: err instanceof Error ? err.message : String(err),
        ms: performance.now() - started,
      })
    }
  }

  const passed = results.filter((r) => r.verdict === 'pass').length
  post({ results, passed, total: results.length, ok: passed === results.length })
}

function post(payload: unknown) {
  ;(self as unknown as Worker).postMessage(payload)
}
