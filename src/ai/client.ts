import Anthropic from '@anthropic-ai/sdk'

export type ModelId = 'claude-opus-5' | 'claude-sonnet-5' | 'claude-haiku-4-5'

export const MODELS: { id: ModelId; label: string; note: string }[] = [
  { id: 'claude-opus-5', label: 'Opus 5', note: 'strongest — the default an interviewer would hand you' },
  { id: 'claude-sonnet-5', label: 'Sonnet 5', note: 'near-Opus on coding, faster' },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5', note: 'fastest, cheapest — a real handicap in Prompt Golf' },
]

const KEY_STORAGE = 'leetclaude.apiKey'
const MODEL_STORAGE = 'leetclaude.model'

export function getApiKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? ''
}

export function setApiKey(key: string) {
  if (key) localStorage.setItem(KEY_STORAGE, key)
  else localStorage.removeItem(KEY_STORAGE)
}

export function getModel(): ModelId {
  const stored = localStorage.getItem(MODEL_STORAGE) as ModelId | null
  return stored && MODELS.some((m) => m.id === stored) ? stored : 'claude-opus-5'
}

export function setModel(model: ModelId) {
  localStorage.setItem(MODEL_STORAGE, model)
}

function client() {
  const apiKey = getApiKey()
  if (!apiKey) throw new NoKeyError()
  // The key lives in this browser only and is sent straight to api.anthropic.com.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

export class NoKeyError extends Error {
  constructor() {
    super('No API key configured.')
    this.name = 'NoKeyError'
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * `effort` and adaptive thinking are only accepted on the 5-series models;
 * Haiku 4.5 rejects both, so we send a bare request there.
 */
function tuning(model: ModelId) {
  if (model === 'claude-haiku-4-5') return {}
  return {
    thinking: { type: 'adaptive' as const },
    output_config: { effort: 'medium' as const },
  }
}

/** Streams an assistant reply, calling `onDelta` with each chunk of text. */
export async function streamChat(
  messages: ChatMessage[],
  system: string,
  onDelta: (text: string) => void,
): Promise<string> {
  const model = getModel()
  const stream = client().messages.stream({
    model,
    max_tokens: 8000,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    ...tuning(model),
  })

  stream.on('text', onDelta)
  const final = await stream.finalMessage()

  return final.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

const GOLF_SYSTEM = `You are being invoked by a candidate through a coding platform. You will be given a
prompt written by the candidate. Produce exactly one JavaScript function that satisfies it.

Output rules, which are absolute:
- Reply with JavaScript source only. No markdown fences, no prose, no explanation.
- Define a top-level function with the exact name the prompt requires.
- Use no imports, no external libraries, and no top-level side effects.`

/** Prompt Golf: run the candidate's prompt and extract the generated function. */
export async function generateSolution(
  prompt: string,
  entry: string,
  onDelta: (text: string) => void,
): Promise<string> {
  const raw = await streamChat(
    [{ role: 'user', content: `${prompt}\n\nName the function \`${entry}\`.` }],
    GOLF_SYSTEM,
    onDelta,
  )
  return stripFences(raw)
}

function stripFences(text: string): string {
  const fenced = text.match(/```(?:javascript|js)?\n([\s\S]*?)```/)
  return (fenced ? fenced[1] : text).trim()
}

/** Rough token estimate for scoring prompt length without a round trip. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.trim().length / 3.6)
}
