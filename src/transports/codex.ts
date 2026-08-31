import { streamSimple as openAIResponsesStreamSimple } from '@earendil-works/pi-ai/api/openai-responses'
import type {
  Api,
  AssistantMessageEvent,
  Context,
  Model,
  ProviderStreams,
  SimpleStreamOptions,
  StreamOptions,
} from '@earendil-works/pi-ai'

const CODEX_VERSION = '0.114.0'

function compatiblePayload(payload: unknown, systemPrompt: string | undefined): unknown {
  if (typeof payload !== 'object' || payload === null) return payload
  const source = payload as Record<string, unknown>
  const input = Array.isArray(source.input) ? source.input : []
  const filtered = systemPrompt === undefined
    ? input
    : input.filter(item => !(typeof item === 'object'
      && item !== null
      && ((item as { role?: unknown }).role === 'developer' || (item as { role?: unknown }).role === 'system')
      && (item as { content?: unknown }).content === systemPrompt))
  return {
    ...source,
    instructions: systemPrompt ?? source.instructions ?? 'You are a coding agent.',
    input: filtered,
    store: false,
    stream: true,
    tool_choice: source.tool_choice ?? 'auto',
    parallel_tool_calls: source.parallel_tool_calls ?? true,
    text: source.text ?? { verbosity: 'low' },
    include: Array.isArray(source.include)
      ? [...new Set([...source.include, 'reasoning.encrypted_content'])]
      : ['reasoning.encrypted_content'],
  }
}

function nativeContext(context: Context): Context {
  return {
    ...context,
    messages: context.messages.map(message => message.role === 'assistant'
      ? { ...message, provider: 'openai-codex' }
      : message),
  }
}

function restoreProvider(value: unknown): void {
  if (typeof value !== 'object' || value === null) return
  const record = value as Record<string, unknown>
  if (record.provider === 'openai-codex') record.provider = 'anyrouter'
  for (const key of ['content', 'partial', 'message', 'error']) {
    const child = record[key]
    if (Array.isArray(child)) child.forEach(restoreProvider)
    else restoreProvider(child)
  }
}

async function* restoredEvents(events: AsyncIterable<AssistantMessageEvent>): AsyncGenerator<AssistantMessageEvent> {
  for await (const event of events) {
    restoreProvider(event)
    yield event
  }
}

function runCodex(model: Model<Api>, context: Context, options?: SimpleStreamOptions): AsyncIterable<AssistantMessageEvent> {
  const attribution = typeof options?.headers?.['user-agent'] === 'string'
    ? ` ${options.headers['user-agent']}`
    : ''
  const headers = {
    ...options?.headers,
    accept: 'text/event-stream',
    'openai-beta': 'responses=experimental',
    'user-agent': `codex_cli_rs/${CODEX_VERSION}${attribution}`,
    originator: 'codex_cli_rs',
  }
  const nativeModel = { ...model, provider: 'openai-codex' } as Model<'openai-responses'>
  const events = openAIResponsesStreamSimple(nativeModel, nativeContext(context), {
    ...options,
    transport: 'sse',
    headers,
    maxRetries: 0,
    onPayload: async (payload) => {
      const compatible = compatiblePayload(payload, context.systemPrompt)
      return options?.onPayload === undefined
        ? compatible
        : (await options.onPayload(compatible, model)) ?? compatible
    },
  })
  return restoredEvents(events)
}

export const codexResponsesStreams: ProviderStreams = {
  stream(model: Model<Api>, context: Context, options?: StreamOptions) {
    return runCodex(model, context, options as SimpleStreamOptions | undefined) as ReturnType<ProviderStreams['stream']>
  },
  streamSimple(model: Model<Api>, context: Context, options?: SimpleStreamOptions) {
    return runCodex(model, context, options) as ReturnType<ProviderStreams['streamSimple']>
  },
}
