import { createHash, randomBytes, randomUUID } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import { stream as anthropicStream } from '@earendil-works/pi-ai/api/anthropic-messages'
import type {
  Api,
  AssistantMessageEvent,
  Context,
  Model,
  ProviderStreams,
  ProviderHeaders,
  SimpleStreamOptions,
  StreamOptions,
  ThinkingLevel,
} from '@earendil-works/pi-ai'
import type { AnthropicOptions } from '@earendil-works/pi-ai/api/anthropic-messages'

const CLAUDE_CODE_VERSION = '2.1.239'

export const CLAUDE_CODE_BETAS = [
  'claude-code-20250219',
  'context-1m-2025-08-07',
  'interleaved-thinking-2025-05-14',
  'thinking-token-count-2026-05-13',
  'context-management-2025-06-27',
  'prompt-caching-scope-2026-01-05',
  'mid-conversation-system-2026-04-07',
  'effort-2025-11-24',
  'fallback-credit-2026-06-01',
] as const

const BILLING_IDENTITY = `x-anthropic-billing-header: cc_version=${CLAUDE_CODE_VERSION}.f32; cc_entrypoint=sdk-cli;`
const AGENT_IDENTITY = "You are a Claude agent, built on Anthropic's Claude Agent SDK."

const CLAUDE_TOOL_NAMES: Readonly<Record<string, string>> = {
  read: 'Read',
  write: 'Write',
  edit: 'Edit',
  bash: 'Bash',
  grep: 'Grep',
  glob: 'Glob',
  ask_user_question: 'AskUserQuestion',
  enter_plan_mode: 'EnterPlanMode',
  exit_plan_mode: 'ExitPlanMode',
  kill_shell: 'KillShell',
  notebook_edit: 'NotebookEdit',
  task: 'Task',
  task_output: 'TaskOutput',
  skill: 'Skill',
  todo_write: 'TodoWrite',
  web_fetch: 'WebFetch',
  web_search: 'WebSearch',
}

function wireToolName(name: string): string {
  return CLAUDE_TOOL_NAMES[name.toLowerCase()] ?? name
}

function mappedContext(context: Context): { context: Context; fromWire: ReadonlyMap<string, string> } {
  const fromWire = new Map<string, string>()
  for (const tool of context.tools ?? []) fromWire.set(wireToolName(tool.name).toLowerCase(), tool.name)
  const remap = (name: string): string => {
    const wire = wireToolName(name)
    if (!fromWire.has(wire.toLowerCase())) fromWire.set(wire.toLowerCase(), name)
    return wire
  }
  const messages = context.messages.map((message) => {
    if (message.role === 'assistant') {
      return {
        ...message,
        content: message.content.map(block => block.type === 'toolCall' ? { ...block, name: remap(block.name) } : block),
      }
    }
    if (message.role === 'toolResult') return { ...message, toolName: remap(message.toolName) }
    return message
  })
  const tools = context.tools?.map(tool => ({ ...tool, name: remap(tool.name) }))
  return {
    context: {
      ...context,
      messages,
      ...tools === undefined ? {} : { tools },
    },
    fromWire,
  }
}

function restoreName(value: unknown, fromWire: ReadonlyMap<string, string>): void {
  if (typeof value !== 'object' || value === null) return
  const record = value as Record<string, unknown>
  if (record.type === 'toolCall' && typeof record.name === 'string') {
    record.name = fromWire.get(record.name.toLowerCase()) ?? record.name
  }
  for (const key of ['content', 'partial', 'message', 'error', 'toolCall']) {
    const child = record[key]
    if (Array.isArray(child)) child.forEach(entry => restoreName(entry, fromWire))
    else restoreName(child, fromWire)
  }
}

async function* restoredEvents(
  events: AsyncIterable<AssistantMessageEvent>,
  fromWire: ReadonlyMap<string, string>,
): AsyncGenerator<AssistantMessageEvent> {
  for await (const event of events) {
    restoreName(event, fromWire)
    yield event
  }
}

function appendBetaQuery(input: string | URL | Request): string | URL | Request {
  if (input instanceof Request) {
    const url = new URL(input.url)
    if (url.pathname.endsWith('/v1/messages')) url.searchParams.set('beta', 'true')
    return new Request(url, input)
  }
  const url = new URL(input.toString())
  if (url.pathname.endsWith('/v1/messages')) url.searchParams.set('beta', 'true')
  return typeof input === 'string' ? url.toString() : url
}

function createClient(
  model: Model<Api>,
  apiKey: string,
  sessionId: string | undefined,
  headers: ProviderHeaders | undefined,
): Anthropic {
  const attribution = typeof headers?.['user-agent'] === 'string' ? ` ${headers['user-agent']}` : ''
  return new Anthropic({
    apiKey: null,
    authToken: apiKey,
    baseURL: model.baseUrl,
    maxRetries: 0,
    defaultHeaders: {
      ...headers,
      accept: 'application/json',
      'anthropic-beta': CLAUDE_CODE_BETAS.join(','),
      'anthropic-dangerous-direct-browser-access': 'true',
      'user-agent': `claude-cli/${CLAUDE_CODE_VERSION} (external, sdk-cli)${attribution}`,
      'x-app': 'cli',
      ...sessionId === undefined ? {} : { 'x-claude-code-session-id': sessionId },
    },
    fetch: (input, init) => fetch(appendBetaQuery(input), init),
  })
}

const DEVICE_ID = randomBytes(32).toString('hex')

function sessionUuid(sessionId: string | undefined): string {
  if (sessionId === undefined) return randomUUID()
  const value = createHash('sha256').update(sessionId).digest('hex').slice(0, 32)
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-4${value.slice(13, 16)}-8${value.slice(17, 20)}-${value.slice(20)}`
}

function compatiblePayload(payload: unknown, sessionId: string | undefined): unknown {
  if (typeof payload !== 'object' || payload === null) return payload
  const source = payload as Record<string, unknown>
  const currentSystem = Array.isArray(source.system) ? source.system : []
  const systemText = new Set(currentSystem.flatMap(block => typeof block === 'object'
    && block !== null
    && typeof (block as { text?: unknown }).text === 'string'
    ? [(block as { text: string }).text]
    : []))
  const identities = [
    { type: 'text', text: BILLING_IDENTITY },
    { type: 'text', text: AGENT_IDENTITY, cache_control: { type: 'ephemeral' } },
  ].filter(block => !systemText.has(block.text))
  const system = [...identities, ...currentSystem.map(block => typeof block === 'object' && block !== null
    ? { ...block, cache_control: { type: 'ephemeral' } }
    : block)]
  const messages = Array.isArray(source.messages) ? source.messages.map((message, index, all) => {
    if (index !== all.length - 1 || typeof message !== 'object' || message === null) return message
    const content = (message as { content?: unknown }).content
    if (!Array.isArray(content) || content.length === 0) return message
    return {
      ...message,
      content: content.map((block, blockIndex) => blockIndex === content.length - 1
        && typeof block === 'object'
        && block !== null
        && (block as { type?: unknown }).type === 'text'
        ? { ...block, cache_control: { type: 'ephemeral' } }
        : block),
    }
  }) : source.messages
  const sourceTools = Array.isArray(source.tools) ? source.tools : undefined
  const tools = sourceTools !== undefined && sourceTools.length > 0
    ? sourceTools.map((tool, index) => index === sourceTools.length - 1
      && typeof tool === 'object'
      && tool !== null
      ? { ...tool, cache_control: { type: 'ephemeral' } }
      : tool)
    : source.tools
  return {
    ...source,
    system,
    messages,
    tools,
    metadata: {
      ...(typeof source.metadata === 'object' && source.metadata !== null ? source.metadata : {}),
      user_id: JSON.stringify({ device_id: DEVICE_ID, account_uuid: '', session_id: sessionUuid(sessionId) }),
    },
    context_management: {
      edits: [{ type: 'clear_thinking_20251015', keep: 'all' }],
    },
  }
}

function effortOf(level: ThinkingLevel): 'low' | 'medium' | 'high' | 'xhigh' | 'max' {
  if (level === 'minimal' || level === 'low') return 'low'
  return level
}

function budgetOf(level: ThinkingLevel): number {
  switch (level) {
    case 'minimal': return 1_024
    case 'low': return 2_048
    case 'medium': return 8_192
    case 'high':
    case 'xhigh':
    case 'max': return 16_384
  }
}

function runClaude(
  model: Model<Api>,
  context: Context,
  options: SimpleStreamOptions | undefined,
): AsyncIterable<AssistantMessageEvent> {
  const apiKey = options?.apiKey
  if (apiKey === undefined || apiKey.trim().length === 0) throw new Error('No API key for provider: anyrouter')
  const mapped = mappedContext(context)
  const reasoning = options?.reasoning
  const anthropicModel = model as Model<'anthropic-messages'>
  const adaptive = anthropicModel.compat?.forceAdaptiveThinking === true
  const { apiKey: _apiKey, reasoning: _reasoning, headers, ...baseOptions } = options ?? {}
  const requestedMaxTokens = baseOptions.maxTokens ?? anthropicModel.maxTokens
  const thinkingBudget = reasoning === undefined || adaptive
    ? undefined
    : Math.min(budgetOf(reasoning), Math.max(0, requestedMaxTokens - 1_024))
  const thinkingEnabled = reasoning !== undefined && (adaptive || (thinkingBudget ?? 0) >= 1_024)
  const anthropicOptions: AnthropicOptions = {
    ...baseOptions,
    client: createClient(model, apiKey, options?.sessionId, headers),
    thinkingDisplay: 'omitted',
    maxRetries: 0,
    thinkingEnabled,
    ...reasoning === undefined || !thinkingEnabled
      ? {}
      : adaptive
        ? { effort: effortOf(reasoning) }
        : { thinkingBudgetTokens: thinkingBudget! },
    onPayload: async (payload, payloadModel) => {
      const compatible = compatiblePayload(payload, options?.sessionId)
      return options?.onPayload === undefined
        ? compatible
        : (await options.onPayload(compatible, payloadModel)) ?? compatible
    },
  }
  const events = anthropicStream(anthropicModel, mapped.context, anthropicOptions)
  return restoredEvents(events, mapped.fromWire)
}

export const claudeCodeStreams: ProviderStreams = {
  stream(model: Model<Api>, context: Context, options?: StreamOptions) {
    return runClaude(model, context, options as SimpleStreamOptions | undefined) as ReturnType<ProviderStreams['stream']>
  },
  streamSimple(model: Model<Api>, context: Context, options?: SimpleStreamOptions) {
    return runClaude(model, context, options) as ReturnType<ProviderStreams['streamSimple']>
  },
}
