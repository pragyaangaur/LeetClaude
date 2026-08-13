import { useRef, useState } from 'react'
import { NoKeyError, streamChat, type ChatMessage } from '../ai/client'
import type { Problem } from '../types'

interface Props {
  problem: Problem
  code: string
  onTurn: () => void
  onInsert: (snippet: string) => void
  onOpenSettings: () => void
}

const SYSTEM = `You are the assistant available to a candidate inside a technical assessment.
Help them genuinely — explain, suggest, and write code when asked.

Two standing constraints:
- Never claim a solution is correct because it looks correct. If you have not seen it pass a
  test, say so.
- When you spot an assumption the candidate has not tested, name it.`

export function Assistant({ problem, code, onTurn, onInsert, onOpenSettings }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)

  async function send() {
    const text = draft.trim()
    if (!text || streaming) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages([...next, { role: 'assistant', content: '' }])
    setDraft('')
    setStreaming(true)
    setError(null)
    onTurn()

    const context = `${SYSTEM}

The candidate is working on "${problem.title}".

<problem_statement>
${problem.statement}
</problem_statement>

<candidate_current_code>
${code || '(empty)'}
</candidate_current_code>`

    try {
      await streamChat(next, context, (delta) => {
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = {
            role: 'assistant',
            content: copy[copy.length - 1].content + delta,
          }
          return copy
        })
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
      })
    } catch (err) {
      setMessages(next)
      setError(
        err instanceof NoKeyError
          ? 'no-key'
          : err instanceof Error
            ? err.message
            : 'Request failed.',
      )
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="assistant">
      <div className="assistant-log" ref={scroller}>
        {messages.length === 0 && !error && (
          <div className="assistant-empty">
            <p>The assistant is open, as it would be in a modern OA.</p>
            <p className="muted">
              Everything you do here is recorded — turns taken, code pasted, tests run before
              submitting. None of it is forbidden. All of it is scored.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content || <span className="cursor" />}
            {m.role === 'assistant' && m.content && extractCode(m.content) && (
              <button className="btn tiny" onClick={() => onInsert(extractCode(m.content)!)}>
                Paste into editor
              </button>
            )}
          </div>
        ))}

        {error === 'no-key' ? (
          <div className="notice">
            No API key configured.{' '}
            <button className="linkish" onClick={onOpenSettings}>
              Add one
            </button>{' '}
            to turn the assistant on. Every problem is still fully playable without it — except Prompt
            Golf, which is nothing but the model.
          </div>
        ) : error ? (
          <div className="notice error">{error}</div>
        ) : null}
      </div>

      <div className="assistant-input">
        <textarea
          value={draft}
          placeholder="Ask the assistant…"
          rows={3}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send()
          }}
        />
        <button className="btn primary" onClick={send} disabled={streaming || !draft.trim()}>
          {streaming ? 'Thinking…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

function extractCode(text: string): string | null {
  const match = text.match(/```(?:javascript|js)?\n([\s\S]*?)```/)
  return match ? match[1].trim() : null
}
