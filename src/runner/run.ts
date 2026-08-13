import type { RunResult, TestCase } from '../types'

const TIME_LIMIT_MS = 3000

/**
 * Runs candidate code against the test set in a throwaway worker.
 * A fresh worker per run is what lets us enforce the time limit — an infinite
 * loop in user code can only be stopped by terminating the thread it owns.
 */
export function runTests(code: string, entry: string, tests: TestCase[]): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })

    const timer = setTimeout(() => {
      worker.terminate()
      resolve({
        results: tests.map((t) => ({
          name: t.name,
          hidden: !!t.hidden,
          verdict: 'timeout' as const,
          message: `exceeded ${TIME_LIMIT_MS}ms`,
          ms: TIME_LIMIT_MS,
        })),
        passed: 0,
        total: tests.length,
        ok: false,
      })
    }, TIME_LIMIT_MS)

    worker.onmessage = (e: MessageEvent<RunResult>) => {
      clearTimeout(timer)
      worker.terminate()
      resolve(e.data)
    }

    worker.onerror = (e) => {
      clearTimeout(timer)
      worker.terminate()
      resolve({
        results: [],
        passed: 0,
        total: tests.length,
        ok: false,
        compileError: e.message || 'worker crashed',
      })
    }

    worker.postMessage({ code, entry, tests })
  })
}
